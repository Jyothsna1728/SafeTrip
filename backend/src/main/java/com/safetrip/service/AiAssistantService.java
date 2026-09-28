package com.safetrip.service;

import com.safetrip.dto.AssistantChatRequest;
import com.safetrip.dto.AssistantChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiAssistantService {
    private static final Logger logger = LoggerFactory.getLogger(AiAssistantService.class);

    @Value("${safetrip.groq.api-key:${GROQ_API_KEY:}}")
    private String groqApiKey;

    @Value("${safetrip.groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    @Value("${safetrip.groq.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqUrl;

    @Value("${safetrip.google.maps.api-key:${GOOGLE_MAPS_API_KEY:}}")
    private String googleApiKey;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private PlacesProviderClient placesProviderClient;

    private static final String SYSTEM_PROMPT =
            "You are SafeTrip AI, an exceptionally knowledgeable, friendly, and human-like travel assistant and trip planner (like ChatGPT).\n\n" +
            "GUIDELINES FOR YOUR RESPONSES:\n" +
            "1. 💬 TONE & STYLE: Highly conversational, warm, engaging, intelligent, and natural (like an experienced local friend).\n" +
            "2. 🗺️ DETAILED ITINERARIES WITH TIMINGS: When asked for an itinerary (e.g. 'Plan a 3-day trip for Hyderabad' or 'detailed trip with time and places'), provide a vivid, realistic hour-by-hour plan (e.g., 08:30 AM - Morning, 12:30 PM - Lunch & Local Specialties, 04:00 PM - Afternoon heritage, 07:30 PM - Evening sunset & dinner). Include exact landmark names, ticket/queue advice, and logical travel transit.\n" +
            "3. 🍲 AUTHENTIC FOOD RECOMMENDATIONS: Name iconic dishes and specific legendary eateries/cafes/street stalls (e.g., authentic Biryani, Irani Chai with Osmania biscuits, Double ka Meetha, Mirchi Bajji).\n" +
            "4. 🛡️ SAFETY & PRACTICAL TIPS: Include practical neighborhood safety advice, metro/cab transit tips, women/solo travel advice, and emergency numbers (112, 100, 108).\n" +
            "5. ⛅ REAL-TIME WEATHER: Integrate live weather into your advice when provided.\n" +
            "6. 🎨 FORMATTING: Use clean markdown with headers, bold text, bullet points, and appropriate emojis.";

    public AssistantChatResponse chat(AssistantChatRequest request) {
        String userPrompt = request.getMessage() != null ? request.getMessage().trim() : "";
        String destination = request.getDestination() != null ? request.getDestination().trim() : "";

        // 1. Try Groq API (with User-Agent to avoid Cloudflare 403)
        if (StringUtils.hasText(groqApiKey) && !"your_groq_api_key_here".equals(groqApiKey.trim())) {
            AssistantChatResponse groqResp = tryGroqChat(request, userPrompt, destination);
            if (groqResp != null && StringUtils.hasText(groqResp.getReply())) {
                return groqResp;
            }
        }

        // 2. Try Google Gemini API with Google API Key
        if (StringUtils.hasText(googleApiKey)) {
            AssistantChatResponse geminiResp = tryGeminiChat(request, userPrompt, destination);
            if (geminiResp != null && StringUtils.hasText(geminiResp.getReply())) {
                return geminiResp;
            }
        }

        // 3. Smart offline intelligent generator
        return buildOfflineTravelAdvice(userPrompt, destination);
    }

    private AssistantChatResponse tryGroqChat(AssistantChatRequest request, String userPrompt, String destination) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey.trim());
            headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
            headers.set(HttpHeaders.ACCEPT, "application/json");

            List<Map<String, String>> messages = new ArrayList<>();

            // System prompt
            Map<String, String> sysMsg = new HashMap<>();
            sysMsg.put("role", "system");
            StringBuilder sysContent = new StringBuilder(SYSTEM_PROMPT);
            if (StringUtils.hasText(destination)) {
                sysContent.append("\n\n[Active Destination: '").append(destination).append("']");
            }
            String weatherInfo = resolveLiveWeather(userPrompt, destination);
            if (StringUtils.hasText(weatherInfo)) {
                sysContent.append("\n\n").append(weatherInfo);
            }
            sysMsg.put("content", sysContent.toString());
            messages.add(sysMsg);

            // History
            if (request.getHistory() != null && !request.getHistory().isEmpty()) {
                int startIdx = Math.max(0, request.getHistory().size() - 8);
                for (int i = startIdx; i < request.getHistory().size(); i++) {
                    AssistantChatRequest.ChatMessage m = request.getHistory().get(i);
                    if (StringUtils.hasText(m.getRole()) && StringUtils.hasText(m.getContent())) {
                        Map<String, String> msg = new HashMap<>();
                        msg.put("role", m.getRole());
                        msg.put("content", m.getContent());
                        messages.add(msg);
                    }
                }
            }

            // User prompt
            Map<String, String> uMsg = new HashMap<>();
            uMsg.put("role", "user");
            uMsg.put("content", userPrompt);
            messages.add(uMsg);

            List<String> candidateModels = Arrays.asList("llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it");
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1600);

            for (String modelName : candidateModels) {
                try {
                    requestBody.put("model", modelName);
                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                    ResponseEntity<Map> response = restTemplate.postForEntity(groqUrl.trim(), entity, Map.class);
                    if (response.getBody() != null && response.getBody().get("choices") instanceof List) {
                        List<?> choices = (List<?>) response.getBody().get("choices");
                        if (!choices.isEmpty() && choices.get(0) instanceof Map) {
                            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                            Map<?, ?> messageObj = (Map<?, ?>) choice.get("message");
                            if (messageObj != null && messageObj.get("content") != null) {
                                return new AssistantChatResponse(((String) messageObj.get("content")).trim());
                            }
                        }
                    }
                } catch (org.springframework.web.client.HttpStatusCodeException se) {
                    logger.warn("Groq model '{}' returned HTTP {}: {}", modelName, se.getStatusCode(), se.getResponseBodyAsString());
                }
            }
        } catch (Exception e) {
            logger.warn("Groq chat execution failed: {}", e.getMessage());
        }
        return null;
    }

    private AssistantChatResponse tryGeminiChat(AssistantChatRequest request, String userPrompt, String destination) {
        try {
            String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + googleApiKey.trim();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(HttpHeaders.USER_AGENT, "SafeTripApp/1.0");

            Map<String, Object> body = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();

            // Build full conversational prompt
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append(SYSTEM_PROMPT).append("\n\n");
            if (StringUtils.hasText(destination)) {
                promptBuilder.append("Destination Context: ").append(destination).append("\n");
            }
            String weather = resolveLiveWeather(userPrompt, destination);
            if (StringUtils.hasText(weather)) {
                promptBuilder.append(weather).append("\n");
            }
            if (request.getHistory() != null) {
                for (AssistantChatRequest.ChatMessage m : request.getHistory()) {
                    promptBuilder.append(m.getRole().toUpperCase()).append(": ").append(m.getContent()).append("\n");
                }
            }
            promptBuilder.append("USER: ").append(userPrompt).append("\nASSISTANT:");

            Map<String, Object> contentPart = new HashMap<>();
            contentPart.put("parts", Collections.singletonList(Collections.singletonMap("text", promptBuilder.toString())));
            contents.add(contentPart);
            body.put("contents", contents);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(geminiUrl, entity, Map.class);

            if (response.getBody() != null && response.getBody().get("candidates") instanceof List) {
                List<?> candidates = (List<?>) response.getBody().get("candidates");
                if (!candidates.isEmpty() && candidates.get(0) instanceof Map) {
                    Map<?, ?> cand = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> content = (Map<?, ?>) cand.get("content");
                    if (content != null && content.get("parts") instanceof List) {
                        List<?> parts = (List<?>) content.get("parts");
                        if (!parts.isEmpty() && parts.get(0) instanceof Map) {
                            String reply = (String) ((Map<?, ?>) parts.get(0)).get("text");
                            if (StringUtils.hasText(reply)) {
                                return new AssistantChatResponse(reply.trim());
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Google Gemini API fallback failed: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Extracts destination from user query or falls back to active UI context.
     */
    private String extractDestination(String userMessage, String contextDestination) {
        if (StringUtils.hasText(userMessage)) {
            String msg = userMessage.trim();
            // Regex patterns for "trip to X", "itinerary for X", "visit X", "in X", "explore X"
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(
                    "(?:trip to|itinerary for|plan for|visit|in|explore|travel to|guide for|food in|weather in)\\s+([A-Za-z\\s]{2,25})",
                    java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher m = p.matcher(msg);
            if (m.find()) {
                String matched = m.group(1).trim().replaceAll("(?i)\\b(the|a|an|with|and|detailed|please|for|days?)\\b.*", "").trim();
                if (matched.length() >= 3 && !matched.equalsIgnoreCase("safe") && !matched.equalsIgnoreCase("trip") && !matched.equalsIgnoreCase("day")) {
                    return capitalizeWords(matched);
                }
            }
        }

        if (StringUtils.hasText(contextDestination) && !"India".equalsIgnoreCase(contextDestination.trim())) {
            return contextDestination.trim();
        }

        return "your chosen destination";
    }

    private String capitalizeWords(String str) {
        if (str == null || str.isEmpty()) return str;
        String[] words = str.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase()).append(" ");
            }
        }
        return sb.toString().trim();
    }

    /**
     * Provides rich, human-like travel advice dynamically customized for ANY requested destination.
     */
    private AssistantChatResponse buildOfflineTravelAdvice(String userMessage, String destination) {
        String msgLower = userMessage != null ? userMessage.toLowerCase() : "";
        String dest = extractDestination(userMessage, destination);

        // 1. Natural Conversational Greetings & Casual Chat (Like ChatGPT)
        if (msgLower.matches("^(hi|hello|hey|hey there|howdy|yo|hi there)[!?.\\s]*$")) {
            return new AssistantChatResponse("Hey there! 👋 How's your day going? What can I help you with today?");
        }

        if (msgLower.contains("how are you") || msgLower.contains("how r u") || msgLower.contains("how are u")) {
            return new AssistantChatResponse("I'm doing great, thanks for asking! 😊 How about you? How's everything going with you today?");
        }

        // 2. Compassionate Emotional Support & Mental Wellbeing (For bad mood, sadness, stress)
        if (msgLower.contains("not good") || msgLower.contains("not feeling well") || msgLower.contains("bad mood") ||
            msgLower.contains("sad") || msgLower.contains("feeling down") || msgLower.contains("feeling low") ||
            msgLower.contains("bad day") || msgLower.contains("stressed") || msgLower.contains("anxious") ||
            msgLower.contains("depressed") || msgLower.contains("lonely") || msgLower.contains("overwhelmed") ||
            msgLower.contains("crying") || msgLower.contains("upset") || msgLower.contains("exhausted") ||
            msgLower.contains("terrible") || msgLower.contains("horrible") || msgLower.contains("unhappy") ||
            msgLower.contains("not okay") || msgLower.contains("not ok") || msgLower.contains("i am low") ||
            msgLower.contains("i'm low") || msgLower.contains("hate my life") || msgLower.contains("feel bad")) {

            // Check if extreme distress
            if (msgLower.contains("die") || msgLower.contains("kill") || msgLower.contains("suicide") || msgLower.contains("end it")) {
                return new AssistantChatResponse(
                        "I hear how much pain you're in, and I want you to know you are not alone. Please reach out to someone who can support you right now — there are people who genuinely care and want to help:\n\n" +
                        "💙 **Free 24/7 Confidential Mental Health Helplines (India)**:\n" +
                        "- **Tele-MANAS (Govt of India)**: **14416** or **1800-891-4416** (Toll-Free, 24/7)\n" +
                        "- **KIRAN Helpline**: **1800-599-0019**\n" +
                        "- **Vandrevala Foundation**: **9999 666 555**\n\n" +
                        "Please talk to a close friend, family member, or a professional. You matter, and things can get better with the right support."
                );
            }

            return new AssistantChatResponse(
                    "I'm really sorry to hear that you're feeling down. 💙 It's completely okay to have bad days and feel not okay.\n\n" +
                    "Remember, you don't have to carry everything by yourself. If you'd like:\n" +
                    "- 🗣️ **Vent or talk it out**: I'm right here to listen without any judgment.\n" +
                    "- 🧘 **Take a gentle breather**: Grab a glass of water, take three slow deep breaths, and give yourself a break.\n" +
                    "- 🌿 **A peaceful distraction**: I can tell you about a serene, tranquil place, share a calming story, or suggest light soothing music.\n\n" +
                    "Would you like to talk about what happened, or would you prefer a peaceful distraction right now?"
            );
        }

        if (msgLower.matches("^(i'm good|im good|good|doing well|fine|all good|great|i am good|not bad)[!?.\\s]*$") || msgLower.contains("i am doing good") || msgLower.contains("im doing well")) {
            return new AssistantChatResponse("Glad to hear that! 😊 What are you up to today? Planning a trip, looking for great food recommendations, or just exploring?");
        }

        if (msgLower.contains("who are you") || msgLower.contains("what can you do") || msgLower.contains("what do you do") || msgLower.contains("your capabilities")) {
            return new AssistantChatResponse(
                    "I'm your **SafeTrip AI companion**! 😊 I can help you with:\n" +
                    "- 🗺️ **Trip Itineraries**: Hour-by-hour travel plans with timings, sights, and hidden gems\n" +
                    "- 🍲 **Food & Delicacies**: Must-try dishes, famous street stalls, and top restaurants\n" +
                    "- 🩺 **Medical & Emergency Support**: First-aid guidance, finding nearby hospitals, and emergency helplines (112, 108)\n" +
                    "- 🛡️ **Safety & Transit**: Women/solo safety advice, metro/cab tips, and live weather\n\n" +
                    "Feel free to ask me anything you'd like to explore!"
            );
        }

        if (msgLower.contains("bored") || msgLower.contains("what should i do") || msgLower.contains("suggest something fun")) {
            return new AssistantChatResponse("If you're looking for something fun, I can suggest great local places to explore, exciting weekend road trips, delicious street foods to try, or interesting facts about any destination you like! What kind of vibe are you in the mood for?");
        }

        if (msgLower.contains("joke") || msgLower.contains("funny")) {
            return new AssistantChatResponse("Why did the traveler cross the road? To explore the other side! 😄 Want another joke, or are you planning a trip somewhere soon?");
        }

        if (msgLower.contains("thank") || msgLower.contains("thx") || msgLower.contains("appreciate")) {
            return new AssistantChatResponse("You're very welcome! 😊 Let me know anytime if you want to explore more places, need food suggestions, or need help with anything!");
        }

        if (msgLower.matches("^(bye|goodbye|see you|cya|take care|good night|gn)[!?.\\s]*$")) {
            return new AssistantChatResponse("Goodbye! Have a wonderful day ahead, and stay safe on all your journeys! 🌟");
        }

        // 2. Medical, Health, Emergency & Problem Solving
        if (msgLower.contains("sick") || msgLower.contains("medical") || msgLower.contains("doctor") || msgLower.contains("hospital") ||
            msgLower.contains("fever") || msgLower.contains("pain") || msgLower.contains("injury") || msgLower.contains("accident") ||
            msgLower.contains("vomit") || msgLower.contains("food poison") || msgLower.contains("medicine") || msgLower.contains("pharmacy") ||
            msgLower.contains("lost") || msgLower.contains("stolen") || msgLower.contains("help") || msgLower.contains("emergency") ||
            msgLower.contains("problem") || msgLower.contains("trouble") || msgLower.contains("stuck")) {

            boolean isMedical = msgLower.contains("sick") || msgLower.contains("fever") || msgLower.contains("pain") || msgLower.contains("injury") ||
                    msgLower.contains("doctor") || msgLower.contains("hospital") || msgLower.contains("vomit") || msgLower.contains("food poison") ||
                    msgLower.contains("medicine") || msgLower.contains("medical");

            if (isMedical) {
                return new AssistantChatResponse(
                        "### 🩺 **Immediate Medical & Health Assistance Guidance**\n\n" +
                        "I'm sorry to hear you're not feeling well. Your health and safety are the top priority. Here are the immediate steps you should take:\n\n" +
                        "1. 🚨 **Emergency Medical Contacts (India)**:\n" +
                        "   - 🚑 **108**: National Free Ambulance & Medical Emergency Service\n" +
                        "   - 🆘 **112**: All-in-one Emergency Helpline\n" +
                        "   - 🏥 **102**: Pregnant Women & Infant Medical Helpline\n\n" +
                        "2. 🏥 **Find Nearest Hospital or 24/7 Pharmacy**:\n" +
                        "   - Switch to the **Safety Hub** tab in SafeTrip to see all verified nearby hospitals, emergency trauma centers, and pharmacies.\n" +
                        "   - If you need immediate prescription medicines, search for 24/7 pharmacy chains (like Apollo Pharmacy or MedPlus).\n\n" +
                        "3. 💧 **First-Aid & Immediate Comfort**:\n" +
                        "   - **Dehydration / Food Issues**: Drink bottled ORS (Oral Rehydration Solution) or coconut water slowly in sips.\n" +
                        "   - **Fever / Body Ache**: Rest in a cool, ventilated room and avoid strenuous activities.\n" +
                        "   - **Consult a Doctor**: For persistent fever, severe stomach pain, or injuries, please visit the nearest hospital emergency room immediately.\n\n" +
                        "4. 📍 **SafeTrip Emergency SOS**:\n" +
                        "   - Click the red **Emergency SOS** button in the navbar to instantly send your GPS coordinates to your registered emergency contact."
                );
            }

            return new AssistantChatResponse(
                    "### 🆘 **Immediate Problem Solving & Support Guide**\n\n" +
                    "Don't worry — let's resolve this step by step. Here is what you should do:\n\n" +
                    "1. 🚨 **Emergency Helplines**:\n" +
                    "   - **112**: All-in-one Police, Fire & Medical\n" +
                    "   - **100**: Police Assistance\n" +
                    "   - **1091 / 181**: Women Safety Helpline\n\n" +
                    "2. 🧳 **Lost Item / Theft / Missing Bag**:\n" +
                    "   - If on transit (metro/cab/bus), check your trip receipt in the Uber/Ola app and tap *'Find Lost Item'*, or report it at the station customer care desk.\n" +
                    "   - File an e-FIR / Lost Property Report at the nearest police station.\n\n" +
                    "3. 🛡️ **Safety Concerns / Feeling Uncomfortable**:\n" +
                    "   - Move immediately to a well-lit, crowded commercial space or hotel lobby.\n" +
                    "   - Tap **Emergency SOS** in SafeTrip to alert your emergency contacts with your live location.\n\n" +
                    "Please let me know the specific details so I can give you exact guidance!"
            );
        }

        // 3. Weather, Temperature, Climate & Packing Advice (Checked before food to avoid substring collision)
        if (msgLower.contains("weather") || msgLower.contains("temperature") || msgLower.contains("climate") ||
            msgLower.contains("forecast") || msgLower.contains("rain") || msgLower.contains("humidity") ||
            msgLower.contains("pack") || msgLower.contains("packing")) {

            String liveWeatherData = fetchDirectLiveWeather(dest);
            if (StringUtils.hasText(liveWeatherData)) {
                return new AssistantChatResponse(liveWeatherData);
            }

            return new AssistantChatResponse(
                    "### ⛅ **Weather & Travel Packing Advice for " + dest + "**\n\n" +
                    "- **🌞 Best Sightseeing Season**: October through March offers pleasant, comfortable weather for outdoor exploration.\n" +
                    "- **👕 Clothing Advice**: Lightweight, breathable cotton clothes for daytime sightseeing; a light jacket/layer for air-conditioned transit or breezy evenings.\n" +
                    "- **👟 Footwear**: Comfortable, supportive walking shoes or slip-on sandals for monument and heritage walks.\n" +
                    "- **🎒 Essentials**: UV sunglasses, SPF sunscreen, a refillable water bottle, and a compact umbrella for sudden weather changes."
            );
        }

        // 4. Foods & Cuisine (Using word boundary regex to avoid 'weather' matching 'eat')
        if (msgLower.matches(".*\\b(food|foods|dish|dishes|delicacy|delicacies|biryani|restaurant|restaurants|eat|eating|cuisine|breakfast|dinner|lunch|sweets)\\b.*")) {
            return new AssistantChatResponse(
                    "### 🍲 **Must-Try Foods & Culinary Highlights for " + dest + "**\n\n" +
                    "Here is a gourmet food lover's guide to the best flavors in " + dest + ":\n\n" +
                    "1. 🍛 **Iconic Signature Dishes**:\n" +
                    "   - Authentic slow-cooked rice & meat dishes (Biryani / Pulao / Pulao platters).\n" +
                    "   - Rich heritage curries served with tandoori breads, parottas, or steamed rice.\n\n" +
                    "2. 🥞 **Breakfast Classics & Street Delicacies**:\n" +
                    "   - Crispy ghee dosas, fluffy idlis with spicy podi, and freshly fried vadas.\n" +
                    "   - Savory evening street bites: Mirchi bajji, samosas, kachoris, and tangy chaat.\n\n" +
                    "3. ☕ **Famous Local Brews**:\n" +
                    "   - Piping hot Irani chai, South Indian filter coffee, or saffron-infused spiced tea.\n" +
                    "   - Pair with buttery local biscuits, bun maska, or warm samosas.\n\n" +
                    "4. 🍮 **Traditional Desserts & Bakeries**:\n" +
                    "   - Rich milk-based desserts, apricot compotes, and dry-fruit halwas from heritage sweet shops.\n\n" +
                    "*Tip: Opt for busy restaurants and bustling market stalls for the freshest ingredients and authentic flavors.*"
            );
        }

        // 5. Safety Guidance & Emergency Helplines
        if (msgLower.contains("safety") || msgLower.contains("emergency") || msgLower.contains("police") || msgLower.contains("tip") || msgLower.contains("women") || msgLower.contains("scam") || msgLower.contains("safe")) {
            return new AssistantChatResponse(
                    "### 🛡️ **Travel Safety & Local Guidance for " + dest + "**\n\n" +
                    "Here are essential safety guidelines to ensure a worry-free trip in " + dest + ":\n\n" +
                    "1. 🚨 **National Emergency Numbers (India)**:\n" +
                    "   - **112**: All-in-One National Emergency Helpline (Police, Fire, Ambulance)\n" +
                    "   - **100**: Police Control Room\n" +
                    "   - **108**: Medical Emergency & Ambulance\n" +
                    "   - **1091 / 181**: Women Safety Helpline\n\n" +
                    "2. 🚖 **Safe Transit & Commuting**:\n" +
                    "   - Use app-based cabs (Uber/Ola) for fixed pricing and live GPS tracking.\n" +
                    "   - Prefer well-lit metro lines and public transit during late evening hours.\n\n" +
                    "3. 👜 **Market & Crowd Awareness**:\n" +
                    "   - Keep personal valuables, wallets, and phones secure in zippered cross-body bags when in crowded markets.\n" +
                    "   - Verify metered rates or agree on fares before boarding unmetered autos.\n\n" +
                    "4. 📍 **SafeTrip Hub Integration**:\n" +
                    "   - Check our **Safety Hub** tab for live neighborhood safety ratings, nearby police stations, hospitals, and community incident alerts."
            );
        }

        // 6. Conversational fallback
        if (dest.equalsIgnoreCase("your chosen destination")) {
            return new AssistantChatResponse(
                    "I'm here to help with anything! Feel free to ask about trip itineraries, local foods, emergency medical help, safety tips, or any city you want to explore. What's on your mind?"
            );
        }

        return new AssistantChatResponse(
                "I'm here to help with **" + dest + "**! Would you like a day-by-day itinerary, must-try food recommendations, local safety guidelines, or weather updates for " + dest + "?"
        );
    }

    /**
     * Resolves real-time live meteorological weather data for the requested location via Open-Meteo.
     */
    private String resolveLiveWeather(String userMessage, String destination) {
        String queryLocation = destination;
        String msgLower = userMessage != null ? userMessage.toLowerCase() : "";

        // Check if user specifically asks for weather of a place
        boolean mentionsWeather = msgLower.contains("weather") || msgLower.contains("temperature") ||
                msgLower.contains("climate") || msgLower.contains("forecast") || msgLower.contains("rain") ||
                msgLower.contains("pack") || msgLower.contains("packing");

        if (!mentionsWeather && !StringUtils.hasText(queryLocation)) {
            return null;
        }

        if (!StringUtils.hasText(queryLocation)) {
            queryLocation = "Hyderabad";
        }

        try {
            List<com.safetrip.dto.GeocodeResultDto> geo = placesProviderClient.geocode(queryLocation);
            if (geo != null && !geo.isEmpty()) {
                Double lat = geo.get(0).getLatitude();
                Double lon = geo.get(0).getLongitude();
                String placeName = geo.get(0).getCity() != null ? geo.get(0).getCity() : queryLocation;

                String weatherUrl = String.format(Locale.US,
                        "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code",
                        lat, lon);

                ResponseEntity<Map> weatherResp = restTemplate.getForEntity(weatherUrl, Map.class);
                if (weatherResp.getBody() != null && weatherResp.getBody().get("current") instanceof Map) {
                    Map<?, ?> current = (Map<?, ?>) weatherResp.getBody().get("current");
                    Object temp = current.get("temperature_2m");
                    Object feelsLike = current.get("apparent_temperature");
                    Object humidity = current.get("relative_humidity_2m");
                    Object wind = current.get("wind_speed_10m");
                    Object precip = current.get("precipitation");
                    return String.format(Locale.US,
                            "[LIVE WEATHER DATA for %s: Current Temperature: %s°C (Feels like: %s°C), Humidity: %s%%, Wind Speed: %s km/h, Precipitation: %s mm. Use these exact figures if answering weather, climate, clothing, or packing questions.]",
                            placeName, temp, feelsLike, humidity, wind, precip);
                }
            }
        } catch (Exception e) {
            logger.info("Live weather lookup info for '{}': {}", queryLocation, e.getMessage());
        }
        return null;
    }

    /**
     * Directly fetches live real-time meteorological weather for offline/direct response.
     */
    private String fetchDirectLiveWeather(String location) {
        if (!StringUtils.hasText(location) || "your chosen destination".equalsIgnoreCase(location)) {
            return null;
        }

        try {
            List<com.safetrip.dto.GeocodeResultDto> geo = placesProviderClient.geocode(location.trim());
            if (geo != null && !geo.isEmpty()) {
                Double lat = geo.get(0).getLatitude();
                Double lon = geo.get(0).getLongitude();
                String placeName = geo.get(0).getCity() != null ? geo.get(0).getCity() : location.trim();

                String weatherUrl = String.format(Locale.US,
                        "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code",
                        lat, lon);

                ResponseEntity<Map> weatherResp = restTemplate.getForEntity(weatherUrl, Map.class);
                if (weatherResp.getBody() != null && weatherResp.getBody().get("current") instanceof Map) {
                    Map<?, ?> current = (Map<?, ?>) weatherResp.getBody().get("current");
                    Object temp = current.get("temperature_2m");
                    Object feelsLike = current.get("apparent_temperature");
                    Object humidity = current.get("relative_humidity_2m");
                    Object wind = current.get("wind_speed_10m");
                    Object precip = current.get("precipitation");

                    return String.format(Locale.US,
                            "### ⛅ **Real-Time Weather in %s**\n\n" +
                            "- 🌡️ **Current Temperature**: **%s°C** (Feels like: %s°C)\n" +
                            "- 💧 **Relative Humidity**: **%s%%**\n" +
                            "- 💨 **Wind Speed**: **%s km/h**\n" +
                            "- 🌧️ **Precipitation / Rain**: **%s mm**\n\n" +
                            "**👕 Packing & Sightseeing Recommendations**:\n" +
                            "- Wear comfortable, breathable clothing during the day.\n" +
                            "- Keep a refillable water bottle and UV sunglasses for sun protection.\n" +
                            "- Check our **Explore** tab to view top attractions around %s!",
                            placeName, temp, feelsLike, humidity, wind, precip, placeName);
                }
            }
        } catch (Exception e) {
            logger.info("Direct weather fetch error for '{}': {}", location, e.getMessage());
        }
        return null;
    }
}
