package com.safetrip.service;

import com.safetrip.dto.GeocodeResultDto;
import com.safetrip.dto.PlaceDto;
import com.safetrip.exception.PlacesApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Primary
public class GoogleMapsPlacesClient implements PlacesProviderClient {
    private static final Logger logger = LoggerFactory.getLogger(GoogleMapsPlacesClient.class);

    @Value("${safetrip.google.maps.api-key:${GOOGLE_MAPS_API_KEY:}}")
    private String apiKey;

    @Value("${safetrip.google.maps.geocode-url:https://maps.googleapis.com/maps/api/geocode/json}")
    private String geocodeBaseUrl;

    @Value("${safetrip.google.maps.places-url:https://maps.googleapis.com/maps/api/place}")
    private String placesBaseUrl;

    @Autowired
    private RestTemplate restTemplate;

    // In-memory lightweight cache with TTL to optimize Google API usage and billing
    private static final long CACHE_TTL_MS = 1000L * 60 * 60 * 4; // 4 hours TTL
    private final Map<String, CacheEntry<Object>> cache = new ConcurrentHashMap<>();

    private static class CacheEntry<T> {
        final T data;
        final long expiry;

        CacheEntry(T data, long ttlMs) {
            this.data = data;
            this.expiry = System.currentTimeMillis() + ttlMs;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiry;
        }
    }

    private void validateApiKey() {
        if (!StringUtils.hasText(apiKey) || apiKey.trim().isEmpty() || "your_google_maps_api_key_here".equals(apiKey.trim()) || "your_geoapify_api_key_here".equals(apiKey.trim())) {
            throw new PlacesApiException("Google Maps service is not configured. GOOGLE_MAPS_API_KEY is missing or invalid. Please configure a valid Google Maps Platform API key in application.properties or .env.");
        }
    }

    public String getApiKey() {
        return apiKey;
    }

    @Override
    public List<GeocodeResultDto> geocode(String text) {
        validateApiKey();

        if (!StringUtils.hasText(text)) {
            return Collections.emptyList();
        }

        String cacheKey = "geocode:" + text.trim().toLowerCase();
        CacheEntry<Object> cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            @SuppressWarnings("unchecked")
            List<GeocodeResultDto> cachedList = (List<GeocodeResultDto>) cached.data;
            return cachedList;
        }

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(geocodeBaseUrl)
                    .queryParam("address", text.trim())
                    .queryParam("key", apiKey.trim())
                    .build()
                    .toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            List<GeocodeResultDto> results = new ArrayList<>();
            Map<String, Object> body = response.getBody();
            if (body != null && "OK".equals(body.get("status")) && body.get("results") instanceof List) {
                List<?> rawResults = (List<?>) body.get("results");
                for (Object item : rawResults) {
                    if (item instanceof Map) {
                        Map<?, ?> map = (Map<?, ?>) item;
                        String formatted = (String) map.get("formatted_address");
                        Double lat = null;
                        Double lon = null;

                        if (map.get("geometry") instanceof Map) {
                            Map<?, ?> geom = (Map<?, ?>) map.get("geometry");
                            if (geom.get("location") instanceof Map) {
                                Map<?, ?> loc = (Map<?, ?>) geom.get("location");
                                lat = parseDouble(loc.get("lat"));
                                lon = parseDouble(loc.get("lng"));
                            }
                        }

                        String city = null;
                        String state = null;
                        String country = null;

                        if (map.get("address_components") instanceof List) {
                            List<?> components = (List<?>) map.get("address_components");
                            for (Object c : components) {
                                if (c instanceof Map) {
                                    Map<?, ?> comp = (Map<?, ?>) c;
                                    List<?> types = (List<?>) comp.get("types");
                                    String longName = (String) comp.get("long_name");
                                    if (types != null && longName != null) {
                                        if (types.contains("locality") || types.contains("administrative_area_level_2") || types.contains("sublocality")) {
                                            if (city == null) city = longName;
                                        }
                                        if (types.contains("administrative_area_level_1")) {
                                            state = longName;
                                        }
                                        if (types.contains("country")) {
                                            country = longName;
                                        }
                                    }
                                }
                            }
                        }

                        if (city == null && formatted != null) {
                            String[] parts = formatted.split(",");
                            if (parts.length > 0) city = parts[0].trim();
                        }

                        if (lat != null && lon != null) {
                            results.add(new GeocodeResultDto(formatted, city, state, country, lat, lon));
                        }
                    }
                }
            } else if (body != null && "ZERO_RESULTS".equals(body.get("status"))) {
                logger.info("Google Geocoding found zero results for '{}'", text);
                return Collections.emptyList();
            } else if (body != null && ("REQUEST_DENIED".equals(body.get("status")) || "OVER_QUERY_LIMIT".equals(body.get("status")))) {
                String errorMsg = (String) body.get("error_message");
                logger.error("Google Geocoding API error: status={}, msg={}", body.get("status"), errorMsg);
                throw new PlacesApiException("Google Maps Geocoding service error: " + (errorMsg != null ? errorMsg : body.get("status")));
            }

            cache.put(cacheKey, new CacheEntry<>(results, CACHE_TTL_MS));
            return results;
        } catch (HttpClientErrorException.Unauthorized ue) {
            logger.error("Google Maps Geocoding API authentication failed: invalid API key.");
            throw new PlacesApiException("Google Maps authentication failed. Please verify the configured API key.");
        } catch (PlacesApiException pe) {
            throw pe;
        } catch (Exception e) {
            logger.error("Error calling Google Maps Geocoding API: {}", e.getMessage());
            throw new PlacesApiException("Places service temporarily unavailable during destination search.", e);
        }
    }

    @Override
    public GeocodeResultDto reverseGeocode(Double latitude, Double longitude) {
        validateApiKey();

        if (latitude == null || longitude == null) {
            return null;
        }

        String cacheKey = String.format(Locale.US, "revgeocode:%.4f,%.4f", latitude, longitude);
        CacheEntry<Object> cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return (GeocodeResultDto) cached.data;
        }

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(geocodeBaseUrl)
                    .queryParam("latlng", String.format(Locale.US, "%f,%f", latitude, longitude))
                    .queryParam("key", apiKey.trim())
                    .build()
                    .toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null && "OK".equals(body.get("status")) && body.get("results") instanceof List) {
                List<?> rawResults = (List<?>) body.get("results");
                if (!rawResults.isEmpty() && rawResults.get(0) instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) rawResults.get(0);
                    String formatted = (String) map.get("formatted_address");
                    String city = null;
                    String state = null;
                    String country = null;

                    if (map.get("address_components") instanceof List) {
                        List<?> components = (List<?>) map.get("address_components");
                        for (Object c : components) {
                            if (c instanceof Map) {
                                Map<?, ?> comp = (Map<?, ?>) c;
                                List<?> types = (List<?>) comp.get("types");
                                String longName = (String) comp.get("long_name");
                                if (types != null && longName != null) {
                                    if (types.contains("locality") || types.contains("sublocality") || types.contains("administrative_area_level_2")) {
                                        if (city == null) city = longName;
                                    }
                                    if (types.contains("administrative_area_level_1")) {
                                        state = longName;
                                    }
                                    if (types.contains("country")) {
                                        country = longName;
                                    }
                                }
                            }
                        }
                    }

                    GeocodeResultDto dto = new GeocodeResultDto(formatted, city, state, country, latitude, longitude);
                    cache.put(cacheKey, new CacheEntry<>(dto, CACHE_TTL_MS));
                    return dto;
                }
            }

            return new GeocodeResultDto(
                    String.format(Locale.US, "GPS: %.4f, %.4f", latitude, longitude),
                    "My Current Location",
                    "",
                    "",
                    latitude,
                    longitude
            );
        } catch (Exception e) {
            logger.warn("Google reverse geocode failed: {}. Using coordinate fallback.", e.getMessage());
            return new GeocodeResultDto(
                    String.format(Locale.US, "GPS: %.4f, %.4f", latitude, longitude),
                    "My Current Location",
                    "",
                    "",
                    latitude,
                    longitude
            );
        }
    }

    @Override
    public List<PlaceDto> getNearbyPlaces(Double latitude, Double longitude, String category, Integer radiusMeters, Integer limit) {
        validateApiKey();

        if (latitude == null || longitude == null) {
            return Collections.emptyList();
        }

        int radius = (radiusMeters != null && radiusMeters > 0) ? radiusMeters : 15000;
        int maxLimit = (limit != null && limit > 0) ? Math.min(limit, 40) : 30;

        String normCategory = (category == null || category.trim().isEmpty()) ? "all" : category.trim().toLowerCase();

        // If 'all' is requested, query all core categories to guarantee balanced results
        if ("all".equals(normCategory)) {
            return fetchExploreAllCombined(latitude, longitude, radius);
        }

        return queryCategoryPlaces(latitude, longitude, normCategory, radius, maxLimit);
    }

    /**
     * Combines Attractions, Hotels, Restaurants, Hospitals, and Police for destination-wide Explore All.
     */
    private List<PlaceDto> fetchExploreAllCombined(Double latitude, Double longitude, int radius) {
        List<PlaceDto> combinedList = new ArrayList<>();
        Set<String> seenIds = new HashSet<>();
        Set<String> seenNames = new HashSet<>();

        String[] coreCategories = {"attractions", "hotels", "restaurants", "hospitals", "police"};

        for (String cat : coreCategories) {
            try {
                // Fetch top places per category
                List<PlaceDto> catPlaces = queryCategoryPlaces(latitude, longitude, cat, radius, 8);
                for (PlaceDto p : catPlaces) {
                    String normName = normalizePlaceName(p.getName());
                    String nameKey = normName + "_" + Math.round(p.getLatitude() * 100) + "_" + Math.round(p.getLongitude() * 100);
                    if (seenIds.add(p.getId()) && seenNames.add(nameKey)) {
                        combinedList.add(p);
                    }
                }
            } catch (Exception e) {
                logger.warn("Explore All category '{}' encountered non-fatal error: {}", cat, e.getMessage());
            }
        }

        logger.info("Google Places Explore All combined: {} verified places around ({}, {})", combinedList.size(), latitude, longitude);
        return combinedList;
    }

    /**
     * Queries Google Places API for a specific category and applies normalization and verification filtering.
     */
    private List<PlaceDto> queryCategoryPlaces(Double latitude, Double longitude, String category, int radius, int limit) {
        String cacheKey = String.format(Locale.US, "nearby:%s:%.4f,%.4f:%d", category, latitude, longitude, radius);
        CacheEntry<Object> cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            @SuppressWarnings("unchecked")
            List<PlaceDto> cachedList = (List<PlaceDto>) cached.data;
            return cachedList;
        }

        List<PlaceDto> places = new ArrayList<>();

        try {
            // Build query based on category
            List<Map<?, ?>> rawGooglePlaces = executeGooglePlacesQuery(latitude, longitude, category, radius);

            // Set of already seen places to avoid duplicates
            Set<String> seenIds = new HashSet<>();
            Set<String> seenNames = new HashSet<>();

            if ("attractions".equalsIgnoreCase(category) || "attraction".equalsIgnoreCase(category)) {
                List<ScoredPlace> scoredAttractions = new ArrayList<>();

                for (Map<?, ?> raw : rawGooglePlaces) {
                    PlaceDto place = parseGooglePlace(raw, category);
                    if (place == null) continue;

                    // Calculate distance to searched destination
                    double distanceMeters = calculateHaversineDistance(latitude, longitude, place.getLatitude(), place.getLongitude());
                    if (distanceMeters > radius) {
                        continue; // Strictly reject places outside the destination radius
                    }

                    // 1. Confirm the place is genuinely relevant to tourism / heritage
                    if (!isAuthenticTouristAttraction(place, raw, distanceMeters)) {
                        continue;
                    }

                    // 2. Authoritative tourism or heritage information signal (e.g. Wikipedia)
                    boolean hasAuthoritativeKnowledge = enrichAttractionWithWikipedia(place);

                    // 3. Multi-factor tourist relevance score (Types, Landmark Name, Heritage, Distance, supporting prominence)
                    double score = computeTouristRelevanceScore(place, raw, distanceMeters, radius, hasAuthoritativeKnowledge);

                    String normName = normalizePlaceName(place.getName());
                    String nameKey = normName + "_" + Math.round(place.getLatitude() * 100) + "_" + Math.round(place.getLongitude() * 100);

                    if (seenIds.add(place.getId()) && seenNames.add(nameKey)) {
                        scoredAttractions.add(new ScoredPlace(place, score));
                    }
                }

                // Sort by composite tourist relevance score descending
                scoredAttractions.sort((a, b) -> Double.compare(b.score, a.score));

                // Return authentic attractions that meet the tourist relevance threshold
                for (ScoredPlace sp : scoredAttractions) {
                    if (sp.score >= 20.0) {
                        places.add(sp.place);
                        if (places.size() >= limit) {
                            break;
                        }
                    }
                }
            } else {
                for (Map<?, ?> raw : rawGooglePlaces) {
                    PlaceDto place = parseGooglePlace(raw, category);
                    if (place == null) continue;

                    double distanceMeters = calculateHaversineDistance(latitude, longitude, place.getLatitude(), place.getLongitude());
                    if (distanceMeters > radius) {
                        continue; // Strictly reject places outside the destination radius
                    }

                    if ("hospitals".equalsIgnoreCase(category) || "hospital".equalsIgnoreCase(category)) {
                        if (isDiagnosticLab(place, raw)) {
                            continue; // Exclude diagnostic labs
                        }
                    }

                    String normName = normalizePlaceName(place.getName());
                    String nameKey = normName + "_" + Math.round(place.getLatitude() * 100) + "_" + Math.round(place.getLongitude() * 100);

                    if (seenIds.add(place.getId()) && seenNames.add(nameKey)) {
                        places.add(place);
                        if (places.size() >= limit) {
                            break;
                        }
                    }
                }
            }

            cache.put(cacheKey, new CacheEntry<>(places, CACHE_TTL_MS));
            return places;
        } catch (HttpClientErrorException.Unauthorized ue) {
            logger.error("Google Places API 401 Unauthorized.");
            throw new PlacesApiException("Google Maps Places authentication failed. Please check the configured API key.");
        } catch (PlacesApiException pe) {
            throw pe;
        } catch (Exception e) {
            logger.error("Error querying Google Places API for category '{}': {}", category, e.getMessage());
            throw new PlacesApiException("Places are temporarily unavailable. Please try again.", e);
        }
    }

    /**
     * Executes Nearby Search and Text Search against Google Places API (New) with Legacy fallback.
     */
    private List<Map<?, ?>> executeGooglePlacesQuery(Double latitude, Double longitude, String category, int radius) {
        List<Map<?, ?>> results = new ArrayList<>();
        Set<String> seenPlaceIds = new HashSet<>();

        // 1. Try Google Places API (New)
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            headers.set("X-Goog-Api-Key", apiKey.trim());
            headers.set("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.photos,places.editorialSummary,places.priceLevel");

            List<String> validIncludedTypes = new ArrayList<>();
            String textSearchQuery = null;

            switch (category.toLowerCase().trim()) {
                case "attractions":
                case "attraction":
                    validIncludedTypes.add("tourist_attraction");
                    validIncludedTypes.add("historical_landmark");
                    validIncludedTypes.add("museum");
                    validIncludedTypes.add("national_park");
                    validIncludedTypes.add("hindu_temple");
                    validIncludedTypes.add("church");
                    validIncludedTypes.add("mosque");
                    validIncludedTypes.add("park");
                    validIncludedTypes.add("art_gallery");
                    validIncludedTypes.add("amusement_park");
                    textSearchQuery = "tourist attractions and sightseeing places";
                    break;
                case "hotels":
                case "hotel":
                    validIncludedTypes.add("hotel");
                    validIncludedTypes.add("lodging");
                    validIncludedTypes.add("resort_hotel");
                    validIncludedTypes.add("guest_house");
                    validIncludedTypes.add("bed_and_breakfast");
                    validIncludedTypes.add("motel");
                    textSearchQuery = "hotels and resorts";
                    break;
                case "restaurants":
                case "restaurant":
                    validIncludedTypes.add("restaurant");
                    validIncludedTypes.add("cafe");
                    validIncludedTypes.add("bakery");
                    validIncludedTypes.add("fast_food_restaurant");
                    textSearchQuery = "restaurants and cafes";
                    break;
                case "hospitals":
                case "hospital":
                    validIncludedTypes.add("hospital");
                    textSearchQuery = "hospital and medical centers";
                    break;
                case "police":
                    validIncludedTypes.add("police");
                    textSearchQuery = "police station";
                    break;
                default:
                    validIncludedTypes.add("tourist_attraction");
                    validIncludedTypes.add("hotel");
                    validIncludedTypes.add("restaurant");
                    validIncludedTypes.add("hospital");
                    validIncludedTypes.add("police");
                    textSearchQuery = "points of interest";
                    break;
            }

            Map<String, Object> circleMap = new HashMap<>();
            Map<String, Object> centerMap = new HashMap<>();
            centerMap.put("latitude", latitude);
            centerMap.put("longitude", longitude);
            circleMap.put("center", centerMap);
            circleMap.put("radius", (double) Math.min(radius, 50000));

            Map<String, Object> locationRestriction = new HashMap<>();
            locationRestriction.put("circle", circleMap);

            // Step 1a: Execute searchNearby
            try {
                String newNearbyUrl = "https://places.googleapis.com/v1/places:searchNearby";
                Map<String, Object> nearbyRequestBody = new HashMap<>();
                nearbyRequestBody.put("includedTypes", validIncludedTypes);
                nearbyRequestBody.put("maxResultCount", 20);
                nearbyRequestBody.put("locationRestriction", locationRestriction);

                org.springframework.http.HttpEntity<Map<String, Object>> nearbyEntity =
                        new org.springframework.http.HttpEntity<>(nearbyRequestBody, headers);

                ResponseEntity<Map<String, Object>> nearbyResponse = restTemplate.exchange(
                        newNearbyUrl,
                        HttpMethod.POST,
                        nearbyEntity,
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                );

                Map<String, Object> body = nearbyResponse.getBody();
                if (body != null && body.get("places") instanceof List) {
                    List<?> newPlaces = (List<?>) body.get("places");
                    for (Object item : newPlaces) {
                        if (item instanceof Map) {
                            Map<?, ?> itemMap = (Map<?, ?>) item;
                            String pid = (String) itemMap.get("id");
                            if (pid != null && seenPlaceIds.add(pid)) {
                                results.add(itemMap);
                            }
                        }
                    }
                }
            } catch (Exception ne) {
                logger.info("Places API (New) searchNearby info: {}", ne.getMessage());
            }

            // Step 1b: If results are few or for specific queries like police / attractions, augment with searchText
            if (results.size() < 10 && textSearchQuery != null) {
                try {
                    String newTextUrl = "https://places.googleapis.com/v1/places:searchText";
                    Map<String, Object> textRequestBody = new HashMap<>();
                    textRequestBody.put("textQuery", textSearchQuery);
                    textRequestBody.put("maxResultCount", 20);
                    textRequestBody.put("locationRestriction", locationRestriction);

                    org.springframework.http.HttpEntity<Map<String, Object>> textEntity =
                            new org.springframework.http.HttpEntity<>(textRequestBody, headers);

                    ResponseEntity<Map<String, Object>> textResponse = restTemplate.exchange(
                            newTextUrl,
                            HttpMethod.POST,
                            textEntity,
                            new ParameterizedTypeReference<Map<String, Object>>() {}
                    );

                    Map<String, Object> textBody = textResponse.getBody();
                    if (textBody != null && textBody.get("places") instanceof List) {
                        List<?> textPlaces = (List<?>) textBody.get("places");
                        for (Object item : textPlaces) {
                            if (item instanceof Map) {
                                Map<?, ?> itemMap = (Map<?, ?>) item;
                                String pid = (String) itemMap.get("id");
                                if (pid != null && seenPlaceIds.add(pid)) {
                                    results.add(itemMap);
                                }
                            }
                        }
                    }
                } catch (Exception te) {
                    logger.info("Places API (New) searchText info: {}", te.getMessage());
                }
            }

            if (!results.isEmpty()) {
                return results;
            }
        } catch (Exception e) {
            logger.info("Places API (New) search failed: {}. Falling back to legacy.", e.getMessage());
        }

        // 2. Legacy Nearby Search Fallback
        String url = placesBaseUrl + "/nearbysearch/json";
        String location = String.format(Locale.US, "%f,%f", latitude, longitude);
        String typeParam = null;

        switch (category.toLowerCase().trim()) {
            case "attractions":
            case "attraction":
                typeParam = "tourist_attraction";
                break;
            case "hotels":
            case "hotel":
                typeParam = "lodging";
                break;
            case "restaurants":
            case "restaurant":
                typeParam = "restaurant";
                break;
            case "hospitals":
            case "hospital":
                typeParam = "hospital";
                break;
            case "police":
                typeParam = "police";
                break;
            default:
                typeParam = "tourist_attraction";
                break;
        }

        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("location", location)
                    .queryParam("radius", radius)
                    .queryParam("key", apiKey.trim());

            if (typeParam != null) {
                builder.queryParam("type", typeParam);
            }

            URI uri = builder.build().toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null && body.get("results") instanceof List) {
                List<?> rawResults = (List<?>) body.get("results");
                for (Object item : rawResults) {
                    if (item instanceof Map) {
                        Map<?, ?> itemMap = (Map<?, ?>) item;
                        String pid = (String) itemMap.get("place_id");
                        if (pid != null && seenPlaceIds.add(pid)) {
                            results.add(itemMap);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Legacy search encountered error: {}", e.getMessage());
        }

        return results;
    }

    /**
     * Fallback Text Search for places
     */
    private List<Map<?, ?>> executeGooglePlacesTextSearch(Double latitude, Double longitude, String query, int radius) {
        List<Map<?, ?>> results = new ArrayList<>();
        try {
            String url = placesBaseUrl + "/textsearch/json";
            String location = String.format(Locale.US, "%f,%f", latitude, longitude);

            URI uri = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("query", query)
                    .queryParam("location", location)
                    .queryParam("radius", radius)
                    .queryParam("key", apiKey.trim())
                    .build()
                    .toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null && body.get("results") instanceof List) {
                List<?> rawResults = (List<?>) body.get("results");
                for (Object item : rawResults) {
                    if (item instanceof Map) {
                        results.add((Map<?, ?>) item);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Google Text Search fallback error: {}", e.getMessage());
        }
        return results;
    }

    private static class ScoredPlace {
        final PlaceDto place;
        final double score;

        ScoredPlace(PlaceDto place, double score) {
            this.place = place;
            this.score = score;
        }
    }

    /**
     * CONFIRM GOOGLE PLACE TYPE & TOURISM RELEVANCE (Requirements 1, 2, 6)
     * Strictly rejects irrelevant commercial businesses, shops, services, and local utilities.
     */
    private boolean isAuthenticTouristAttraction(PlaceDto place, Map<?, ?> raw, double distanceMeters) {
        if (place == null || !StringUtils.hasText(place.getName())) {
            return false;
        }

        String nameLower = place.getName().toLowerCase().trim();

        // 1. Comprehensive rejection of commercial & local utility businesses
        String[] blacklistedWords = {
                "store", "shop", "supermarket", "groceries", "kirana", "provision", "mart",
                "car repair", "bike repair", "automobile", "auto repair", "garage", "mechanic",
                "hardware", "electrical", "plumbing", "sanitary", "contractor", "traders",
                "bank", "atm", "finance", "loan", "insurance", "chit fund",
                "pharmacy", "medical store", "chemist", "clinic", "diagnostic", "lab", "hospital",
                "tailor", "dress", "textiles", "footwear", "shoe", "saloon", "salon", "beauty parlour", "spa",
                "petrol", "fuel", "gas station", "diesel", "cng",
                "school", "coaching", "tuition", "academy", "college", "institute", "hostel", "pg for",
                "real estate", "developers", "builders", "agencies", "xerox", "printing", "studio",
                "furniture", "steel", "cement", "pipes", "timber", "tyres", "car wash", "service center",
                "restaurant", "hotel", "cafe", "dhaba", "canteen", "bar", "bakery", "fast food"
        };

        for (String word : blacklistedWords) {
            if (nameLower.contains(word)) {
                return false;
            }
        }

        // 2. Google Place Types Check
        List<String> types = place.getCategories();
        if (types != null) {
            for (String t : types) {
                String tl = t.toLowerCase();
                if (tl.contains("store") || tl.contains("convenience") || tl.contains("gas_station") ||
                    tl.contains("car_repair") || tl.contains("atm") || tl.contains("bank") ||
                    tl.contains("pharmacy") || tl.contains("hair_care") || tl.contains("laundry") ||
                    tl.contains("real_estate") || tl.contains("local_government_office") ||
                    tl.contains("dentist") || tl.contains("doctor") || tl.contains("lawyer") ||
                    tl.contains("restaurant") || tl.contains("food") || tl.contains("cafe") ||
                    tl.contains("lodging") || tl.contains("hospital")) {
                    return false;
                }
            }
        }

        // 3. Positive Attraction / Heritage / Sightseeing Criteria
        boolean hasAttractionType = false;
        if (types != null) {
            for (String t : types) {
                String tl = t.toLowerCase();
                if (tl.contains("tourist_attraction") || tl.contains("museum") || tl.contains("historical") ||
                    tl.contains("landmark") || tl.contains("place_of_worship") || tl.contains("hindu_temple") ||
                    tl.contains("church") || tl.contains("mosque") || tl.contains("park") ||
                    tl.contains("monument") || tl.contains("natural_feature") || tl.contains("zoo") ||
                    tl.contains("aquarium") || tl.contains("art_gallery") || tl.contains("amusement_park") ||
                    tl.contains("archaeological_site") || tl.contains("cultural_center") || tl.contains("castle") ||
                    tl.contains("palace") || tl.contains("historic_site") || tl.contains("scenic_viewpoint") ||
                    tl.contains("point_of_interest")) {
                    hasAttractionType = true;
                    break;
                }
            }
        }

        boolean hasAttractionName = nameLower.contains("temple") || nameLower.contains("mandir") ||
                nameLower.contains("masjid") || nameLower.contains("church") ||
                nameLower.contains("fort") || nameLower.contains("palace") ||
                nameLower.contains("museum") || nameLower.contains("monument") ||
                nameLower.contains("park") || nameLower.contains("garden") ||
                nameLower.contains("lake") || nameLower.contains("falls") ||
                nameLower.contains("hill") || nameLower.contains("viewpoint") ||
                nameLower.contains("heritage") || nameLower.contains("sanctuary") ||
                nameLower.contains("ashram") || nameLower.contains("ghat") ||
                nameLower.contains("stupa") || nameLower.contains("caves") ||
                nameLower.contains("dam") || nameLower.contains("gopuram") ||
                nameLower.contains("buddha") || nameLower.contains("memorial");

        if (!hasAttractionType && !hasAttractionName) {
            return false;
        }

        return true;
    }

    /**
     * MULTI-FACTOR TOURIST RELEVANCE SCORING (Requirement Priority 1–5)
     * Prioritizes Google Place Type, Heritage/Tourism evidence, and Geographic Proximity.
     * Uses Rating/Reviews strictly as secondary supporting signals, NOT as the primary decider.
     */
    private double computeTouristRelevanceScore(PlaceDto place, Map<?, ?> raw, double distanceMeters, int maxRadius, boolean hasAuthoritativeKnowledge) {
        double score = 0.0;

        // 1. Google Place Types (Primary Weight: 35-50 points)
        List<String> types = place.getCategories();
        if (types != null) {
            for (String t : types) {
                String tl = t.toLowerCase();
                if (tl.contains("tourist_attraction") || tl.contains("historical_landmark") || tl.contains("museum") ||
                    tl.contains("national_park") || tl.contains("archaeological_site") || tl.contains("palace") || tl.contains("fort")) {
                    score += 45.0;
                    break;
                } else if (tl.contains("place_of_worship") || tl.contains("hindu_temple") || tl.contains("church") ||
                           tl.contains("mosque") || tl.contains("monument") || tl.contains("botanical_garden") || tl.contains("park")) {
                    score += 35.0;
                    break;
                } else if (tl.contains("natural_feature") || tl.contains("point_of_interest") || tl.contains("scenic_viewpoint")) {
                    score += 25.0;
                    break;
                }
            }
        }

        // 2. Recognizable Heritage / Attraction Landmark Name (Weight: 20 points)
        String nameLower = (place.getName() != null ? place.getName() : "").toLowerCase();
        if (nameLower.contains("temple") || nameLower.contains("mandir") || nameLower.contains("church") ||
            nameLower.contains("masjid") || nameLower.contains("fort") || nameLower.contains("palace") ||
            nameLower.contains("museum") || nameLower.contains("monument") || nameLower.contains("lake") ||
            nameLower.contains("falls") || nameLower.contains("sanctuary") || nameLower.contains("heritage") ||
            nameLower.contains("ghat") || nameLower.contains("stupa") || nameLower.contains("caves") ||
            nameLower.contains("dam") || nameLower.contains("garden")) {
            score += 20.0;
        }

        // 3. Authoritative Knowledge / Wikipedia Signal (Weight: 25 points)
        if (hasAuthoritativeKnowledge) {
            score += 25.0;
        }

        // 4. Geographic Proximity to Searched Destination (Weight: up to 30 points - strong local village preference)
        double distanceKm = distanceMeters / 1000.0;
        if (distanceKm <= 3.0) {
            score += 30.0; // Immediate local village / town attraction (e.g. Uppalapadu Bird Sanctuary)
        } else if (distanceKm <= 6.0) {
            score += 20.0;
        } else if (distanceKm <= 10.0) {
            score += 10.0;
        } else {
            score += Math.max(0.0, (1.0 - (distanceMeters / (double) Math.max(1, maxRadius)))) * 5.0;
        }

        // 5. Supporting Prominence Signals (Weight: max 10 points - strictly secondary)
        Object userRatingsTotal = raw.get("user_ratings_total");
        if (userRatingsTotal == null) {
            userRatingsTotal = raw.get("userRatingCount");
        }
        if (userRatingsTotal instanceof Number) {
            int reviews = ((Number) userRatingsTotal).intValue();
            double reviewBonus = Math.min(7.0, Math.log10(reviews + 1) * 2.2);
            score += reviewBonus;
        }

        if (place.getRating() != null && place.getRating() >= 4.0) {
            score += Math.min(3.0, (place.getRating() - 3.5) * 2.0);
        }

        return score;
    }

    /**
     * Checks if a healthcare place is a diagnostic lab (to exclude it).
     */
    private boolean isDiagnosticLab(PlaceDto place, Map<?, ?> raw) {
        String nameLower = (place.getName() != null ? place.getName() : "").toLowerCase();
        if (nameLower.contains("diagnostic") || nameLower.contains("lab") || nameLower.contains("laboratory") ||
            nameLower.contains("scan") || nameLower.contains("x-ray") || nameLower.contains("pathology")) {
            return true;
        }

        List<String> types = place.getCategories();
        if (types != null) {
            for (String t : types) {
                String tl = t.toLowerCase();
                if (tl.contains("laboratory") || tl.contains("medical_lab")) {
                    return true;
                }
            }
        }

        return false;
    }

    @Override
    public PlaceDto getPlaceDetails(String placeId) {
        validateApiKey();

        if (!StringUtils.hasText(placeId)) {
            throw new PlacesApiException("Place ID cannot be empty.");
        }

        String cacheKey = "details:" + placeId.trim();
        CacheEntry<Object> cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return (PlaceDto) cached.data;
        }

        try {
            // Try Places API (New) Details
            try {
                String newDetailsUrl = "https://places.googleapis.com/v1/places/" + placeId.trim();
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("X-Goog-Api-Key", apiKey.trim());
                headers.set("X-Goog-FieldMask", "id,displayName,formattedAddress,location,rating,userRatingCount,types,internationalPhoneNumber,nationalPhoneNumber,websiteUri,regularOpeningHours,photos,editorialSummary,priceLevel");

                org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        newDetailsUrl,
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                );
                Map<String, Object> body = response.getBody();
                if (body != null && body.containsKey("id")) {
                    PlaceDto place = parseGooglePlace(body, null);
                    if (place != null) {
                        if ("attraction".equalsIgnoreCase(place.getCategory())) {
                            enrichAttractionWithWikipedia(place);
                        }
                        cache.put(cacheKey, new CacheEntry<>(place, CACHE_TTL_MS));
                        return place;
                    }
                }
            } catch (Exception ignored) {
            }

            // Legacy Details Fallback
            URI uri = UriComponentsBuilder.fromHttpUrl(placesBaseUrl + "/details/json")
                    .queryParam("place_id", placeId.trim())
                    .queryParam("fields", "place_id,name,formatted_address,geometry,rating,user_ratings_total,types,formatted_phone_number,international_phone_number,website,opening_hours,photos,price_level,editorial_summary")
                    .queryParam("key", apiKey.trim())
                    .build()
                    .toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null && "OK".equals(body.get("status")) && body.get("result") instanceof Map) {
                Map<?, ?> result = (Map<?, ?>) body.get("result");
                PlaceDto place = parseGooglePlace(result, null);
                if (place != null) {
                    if ("attraction".equalsIgnoreCase(place.getCategory())) {
                        enrichAttractionWithWikipedia(place);
                    }
                    cache.put(cacheKey, new CacheEntry<>(place, CACHE_TTL_MS));
                    return place;
                }
            }

            throw new PlacesApiException("Google Place details not found for id: " + placeId);
        } catch (PlacesApiException pe) {
            throw pe;
        } catch (Exception e) {
            logger.error("Error getting Google Place details for id '{}': {}", placeId, e.getMessage());
            throw new PlacesApiException("Places service temporarily unavailable.", e);
        }
    }

    @Override
    public byte[] getPhotoBytes(String photoReference, Integer maxWidth) {
        validateApiKey();
        if (!StringUtils.hasText(photoReference)) {
            return null;
        }

        int width = (maxWidth != null && maxWidth > 0) ? Math.min(maxWidth, 1200) : 800;
        String cacheKey = "photo:" + photoReference + ":" + width;
        CacheEntry<Object> cached = cache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return (byte[]) cached.data;
        }

        try {
            // If photoReference is from Places API (New) (starts with "places/")
            if (photoReference.startsWith("places/")) {
                String photoUrl = "https://places.googleapis.com/v1/" + photoReference.trim() + "/media?maxWidthPx=" + width + "&key=" + apiKey.trim();
                ResponseEntity<byte[]> response = restTemplate.exchange(
                        photoUrl,
                        HttpMethod.GET,
                        null,
                        byte[].class
                );
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    byte[] bytes = response.getBody();
                    cache.put(cacheKey, new CacheEntry<>(bytes, CACHE_TTL_MS));
                    return bytes;
                }
            } else {
                // Legacy Photo Reference
                URI uri = UriComponentsBuilder.fromHttpUrl(placesBaseUrl + "/photo")
                        .queryParam("maxwidth", width)
                        .queryParam("photo_reference", photoReference.trim())
                        .queryParam("key", apiKey.trim())
                        .build()
                        .toUri();

                ResponseEntity<byte[]> response = restTemplate.exchange(
                        uri,
                        HttpMethod.GET,
                        null,
                        byte[].class
                );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    byte[] bytes = response.getBody();
                    cache.put(cacheKey, new CacheEntry<>(bytes, CACHE_TTL_MS));
                    return bytes;
                }
            }
        } catch (Exception e) {
            logger.warn("Error fetching Google Place photo: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Parses a Google Place Map (New or Legacy) into SafeTrip's PlaceDto model.
     */
    private PlaceDto parseGooglePlace(Map<?, ?> raw, String requestedCategory) {
        if (raw == null) return null;

        String placeId = (String) raw.get("id");
        if (!StringUtils.hasText(placeId)) {
            placeId = (String) raw.get("place_id");
            if (!StringUtils.hasText(placeId)) {
                placeId = UUID.randomUUID().toString();
            }
        }

        // Display Name handling (Places API New has displayName.text, Legacy has name)
        String name = null;
        if (raw.get("displayName") instanceof Map) {
            name = (String) ((Map<?, ?>) raw.get("displayName")).get("text");
        }
        if (!StringUtils.hasText(name) && raw.get("name") instanceof String) {
            name = (String) raw.get("name");
        }
        if (!StringUtils.hasText(name)) {
            name = (String) raw.get("formatted_address");
            if (!StringUtils.hasText(name)) {
                name = (String) raw.get("formattedAddress");
                if (!StringUtils.hasText(name)) {
                    name = (String) raw.get("vicinity");
                }
            }
        }
        if (!StringUtils.hasText(name)) {
            name = "Unnamed Location";
        }

        Double lat = null;
        Double lon = null;

        // Location handling (New API has location.latitude/longitude, Legacy has geometry.location.lat/lng)
        if (raw.get("location") instanceof Map) {
            Map<?, ?> loc = (Map<?, ?>) raw.get("location");
            lat = parseDouble(loc.get("latitude"));
            lon = parseDouble(loc.get("longitude"));
        } else if (raw.get("geometry") instanceof Map) {
            Map<?, ?> geom = (Map<?, ?>) raw.get("geometry");
            if (geom.get("location") instanceof Map) {
                Map<?, ?> loc = (Map<?, ?>) geom.get("location");
                lat = parseDouble(loc.get("lat"));
                lon = parseDouble(loc.get("lng"));
            }
        }

        if (lat == null || lon == null) {
            return null;
        }

        List<String> rawTypes = new ArrayList<>();
        if (raw.get("types") instanceof List) {
            List<?> typesList = (List<?>) raw.get("types");
            for (Object t : typesList) {
                if (t instanceof String) {
                    rawTypes.add((String) t);
                }
            }
        }

        String category = determineNormalizedCategory(rawTypes, requestedCategory);
        String subCategory = determineSubCategory(rawTypes, name);

        String address = (String) raw.get("formattedAddress");
        if (!StringUtils.hasText(address)) {
            address = (String) raw.get("formatted_address");
            if (!StringUtils.hasText(address)) {
                address = (String) raw.get("vicinity");
            }
        }

        PlaceDto place = new PlaceDto();
        place.setId(placeId);
        place.setName(name);
        place.setCategory(category);
        place.setSubCategory(subCategory);
        place.setCategories(rawTypes);
        place.setLatitude(lat);
        place.setLongitude(lon);
        place.setAddress(address);

        if (raw.get("rating") != null) {
            place.setRating(parseDouble(raw.get("rating")));
        }

        if (raw.get("formatted_phone_number") instanceof String) {
            place.setPhone((String) raw.get("formatted_phone_number"));
        } else if (raw.get("nationalPhoneNumber") instanceof String) {
            place.setPhone((String) raw.get("nationalPhoneNumber"));
        } else if (raw.get("internationalPhoneNumber") instanceof String) {
            place.setPhone((String) raw.get("internationalPhoneNumber"));
        } else if (raw.get("international_phone_number") instanceof String) {
            place.setPhone((String) raw.get("international_phone_number"));
        }

        if (raw.get("websiteUri") instanceof String) {
            place.setWebsite((String) raw.get("websiteUri"));
        } else if (raw.get("website") instanceof String) {
            place.setWebsite((String) raw.get("website"));
        }

        // Opening hours
        if (raw.get("regularOpeningHours") instanceof Map) {
            Map<?, ?> roh = (Map<?, ?>) raw.get("regularOpeningHours");
            if (roh.get("openNow") instanceof Boolean) {
                place.setOpenNow((Boolean) roh.get("openNow"));
            }
            if (roh.get("weekdayDescriptions") instanceof List) {
                List<?> wd = (List<?>) roh.get("weekdayDescriptions");
                if (!wd.isEmpty()) {
                    place.setOpeningHours(String.valueOf(wd.get(0)));
                }
            }
        } else if (raw.get("opening_hours") instanceof Map) {
            Map<?, ?> oh = (Map<?, ?>) raw.get("opening_hours");
            if (oh.get("open_now") instanceof Boolean) {
                place.setOpenNow((Boolean) oh.get("open_now"));
            }
            if (oh.get("weekday_text") instanceof List) {
                List<?> weekdays = (List<?>) oh.get("weekday_text");
                if (!weekdays.isEmpty()) {
                    place.setOpeningHours(String.valueOf(weekdays.get(0)));
                }
            }
        }

        // Editorial summary / Description
        if (raw.get("editorialSummary") instanceof Map) {
            Map<?, ?> es = (Map<?, ?>) raw.get("editorialSummary");
            if (es.get("text") instanceof String) {
                place.setDescription((String) es.get("text"));
            }
        } else if (raw.get("editorial_summary") instanceof Map) {
            Map<?, ?> es = (Map<?, ?>) raw.get("editorial_summary");
            if (es.get("overview") instanceof String) {
                place.setDescription((String) es.get("overview"));
            }
        }

        if (raw.get("priceLevel") != null) {
            place.setPriceLevel(String.valueOf(raw.get("priceLevel")));
        } else if (raw.get("price_level") != null) {
            place.setPriceLevel(String.valueOf(raw.get("price_level")));
        }

        // Photo Reference handling (New API has name: "places/.../photos/...", Legacy has photo_reference)
        String imageUrl = null;
        if (raw.get("photos") instanceof List && !((List<?>) raw.get("photos")).isEmpty()) {
            Object firstPhoto = ((List<?>) raw.get("photos")).get(0);
            if (firstPhoto instanceof Map) {
                Map<?, ?> photoMap = (Map<?, ?>) firstPhoto;
                String photoRef = (String) photoMap.get("name");
                if (!StringUtils.hasText(photoRef)) {
                    photoRef = (String) photoMap.get("photo_reference");
                }
                if (StringUtils.hasText(photoRef)) {
                    try {
                        imageUrl = "/api/places/photo?ref=" + URLEncoder.encode(photoRef, StandardCharsets.UTF_8.name());
                    } catch (Exception ignored) {
                        imageUrl = "/api/places/photo?ref=" + photoRef;
                    }
                }
            }
        }
        place.setImageUrl(imageUrl);

        // Derive Cuisine for restaurants
        if ("restaurant".equalsIgnoreCase(category)) {
            place.setCuisine(determineCuisine(rawTypes, name));
        }

        // Derive Accommodation Type for hotels
        if ("hotel".equalsIgnoreCase(category)) {
            place.setAccommodationType(subCategory);
        }

        return place;
    }

    private String determineNormalizedCategory(List<String> types, String requestedCategory) {
        if (StringUtils.hasText(requestedCategory) && !"all".equalsIgnoreCase(requestedCategory)) {
            return requestedCategory.toLowerCase().trim();
        }

        for (String t : types) {
            String lower = t.toLowerCase();
            if (lower.contains("hospital") || lower.contains("doctor") || lower.contains("health")) {
                return "hospital";
            }
            if (lower.contains("police")) {
                return "police";
            }
            if (lower.contains("lodging") || lower.contains("hotel") || lower.contains("motel") || lower.contains("resort")) {
                return "hotel";
            }
            if (lower.contains("restaurant") || lower.contains("food") || lower.contains("cafe") || lower.contains("bakery")) {
                return "restaurant";
            }
            if (lower.contains("tourist_attraction") || lower.contains("museum") || lower.contains("landmark") ||
                lower.contains("point_of_interest") || lower.contains("park") || lower.contains("place_of_worship")) {
                return "attraction";
            }
        }
        return "attraction";
    }

    private String determineSubCategory(List<String> types, String name) {
        String nameLower = (name != null ? name : "").toLowerCase();

        for (String t : types) {
            String lower = t.toLowerCase();
            if (lower.contains("museum")) return "Museum";
            if (lower.contains("hindu_temple") || lower.contains("place_of_worship") || nameLower.contains("temple") || nameLower.contains("mandir")) return "Temple / Religious Site";
            if (lower.contains("church")) return "Church";
            if (lower.contains("mosque") || nameLower.contains("masjid")) return "Mosque";
            if (lower.contains("national_park") || lower.contains("park") || nameLower.contains("garden")) return "Park & Nature";
            if (lower.contains("zoo") || lower.contains("aquarium")) return "Zoo / Aquarium";
            if (lower.contains("art_gallery")) return "Art Gallery";
            if (lower.contains("amusement_park")) return "Amusement Park";
            if (lower.contains("historical_landmark") || lower.contains("monument") || nameLower.contains("fort") || nameLower.contains("palace")) return "Monument / Heritage";
            if (lower.contains("resort") || nameLower.contains("resort")) return "Resort";
            if (lower.contains("hostel") || nameLower.contains("hostel")) return "Hostel";
            if (lower.contains("motel")) return "Motel";
            if (lower.contains("cafe") || nameLower.contains("cafe")) return "Cafe";
            if (lower.contains("bakery") || nameLower.contains("bakery")) return "Bakery";
        }

        if (nameLower.contains("fort") || nameLower.contains("palace")) return "Fort / Palace";
        if (nameLower.contains("lake") || nameLower.contains("falls")) return "Nature / Lake";
        if (nameLower.contains("temple") || nameLower.contains("mandir")) return "Temple";

        return null;
    }

    private String determineCuisine(List<String> types, String name) {
        String nameLower = (name != null ? name : "").toLowerCase();
        if (nameLower.contains("indian") || nameLower.contains("dhaba") || nameLower.contains("biryani") || nameLower.contains("thali")) return "Indian / Regional";
        if (nameLower.contains("south indian") || nameLower.contains("dosa") || nameLower.contains("idli")) return "South Indian";
        if (nameLower.contains("north indian") || nameLower.contains("punjabi") || nameLower.contains("tandoor")) return "North Indian";
        if (nameLower.contains("chinese") || nameLower.contains("wok") || nameLower.contains("noodle")) return "Chinese / Asian";
        if (nameLower.contains("pizza") || nameLower.contains("pasta") || nameLower.contains("italian")) return "Italian / Pizza";
        if (nameLower.contains("burger") || nameLower.contains("fast food") || nameLower.contains("cafe")) return "Cafe / Fast Food";
        if (nameLower.contains("bakery") || nameLower.contains("cake") || nameLower.contains("sweets")) return "Bakery & Desserts";
        return "Multi-Cuisine";
    }

    /**
     * Enriches tourist attractions with rich Wikipedia summary, article link, and lead thumbnail.
     */
    private boolean enrichAttractionWithWikipedia(PlaceDto place) {
        if (place == null) return false;
        if (place.getImageUrl() != null && place.getDescription() != null && place.getDescription().length() > 100) return true;

        try {
            String name = place.getName();
            if (!StringUtils.hasText(name) || "Unnamed Location".equalsIgnoreCase(name)) return false;

            // Clean title: remove parenthetical suffixes or address words
            String cleanTitle = name.replaceAll("\\(.*?\\)", "").replaceAll("[^a-zA-Z0-9 ]", "").trim();
            if (cleanTitle.length() < 3) return false;

            String encoded = URLEncoder.encode(cleanTitle.replace(" ", "_"), StandardCharsets.UTF_8.name());
            String wikiApiUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encoded;

            ResponseEntity<Map<String, Object>> wikiRes = restTemplate.exchange(
                    URI.create(wikiApiUrl),
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (wikiRes.getBody() != null) {
                Map<?, ?> body = wikiRes.getBody();
                boolean foundEvidence = false;
                if (body.get("extract") instanceof String) {
                    String extract = (String) body.get("extract");
                    if (extract.length() > 600) {
                        extract = extract.substring(0, 600) + "...";
                    }
                    if (place.getDescription() == null || place.getDescription().length() < extract.length()) {
                        place.setDescription(extract);
                    }
                    foundEvidence = true;
                }

                if (body.get("content_urls") instanceof Map) {
                    Map<?, ?> urls = (Map<?, ?>) body.get("content_urls");
                    if (urls.get("desktop") instanceof Map) {
                        Map<?, ?> desktop = (Map<?, ?>) urls.get("desktop");
                        if (desktop.get("page") instanceof String) {
                            place.setWikipediaUrl((String) desktop.get("page"));
                            foundEvidence = true;
                        }
                    }
                }

                if (place.getImageUrl() == null && body.get("thumbnail") instanceof Map) {
                    Map<?, ?> thumb = (Map<?, ?>) body.get("thumbnail");
                    if (thumb.get("source") instanceof String) {
                        place.setImageUrl((String) thumb.get("source"));
                    }
                } else if (place.getImageUrl() == null && body.get("originalimage") instanceof Map) {
                    Map<?, ?> orig = (Map<?, ?>) body.get("originalimage");
                    if (orig.get("source") instanceof String) {
                        place.setImageUrl((String) orig.get("source"));
                    }
                }
                return foundEvidence;
            }
        } catch (Exception ignored) {
            // Gracefully proceed if Wikipedia summary is not found
        }
        return false;
    }

    /**
     * Haversine formula to compute great-circle distance between two GPS coordinates in meters.
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371000.0 * c; // Earth radius in meters
    }

    private String normalizePlaceName(String name) {
        if (name == null) return "";
        return name.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private Double parseDouble(Object val) {
        if (val instanceof Number) {
            return ((Number) val).doubleValue();
        } else if (val instanceof String) {
            try {
                return Double.parseDouble((String) val);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }
}
