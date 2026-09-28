package com.safetrip.service;

import com.safetrip.dto.GeocodeResultDto;
import com.safetrip.dto.PlaceDto;
import com.safetrip.exception.PlacesApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class GeoapifyPlacesClient implements PlacesProviderClient {
    private static final Logger logger = LoggerFactory.getLogger(GeoapifyPlacesClient.class);

    @Value("${safetrip.places.api-key:51c3c51c9cc14f38a3cdd018d20d771d}")
    private String apiKey;

    @Value("${safetrip.places.base-url:https://api.geoapify.com/v2/places}")
    private String placesBaseUrl;

    @Value("${safetrip.places.geocode-url:https://api.geoapify.com/v1/geocode/search}")
    private String geocodeBaseUrl;

    @Value("${safetrip.places.reverse-geocode-url:https://api.geoapify.com/v1/geocode/reverse}")
    private String reverseGeocodeBaseUrl;

    @Autowired
    private RestTemplate restTemplate;

    private void validateApiKey() {
        if (!StringUtils.hasText(apiKey) || apiKey.trim().isEmpty() || "your_geoapify_api_key_here".equals(apiKey.trim())) {
            throw new PlacesApiException("Places service is not configured. PLACES_API_KEY is missing or invalid. Please configure a valid Geoapify API key in application.properties or .env.");
        }
    }

    @Override
    public List<GeocodeResultDto> geocode(String text) {
        validateApiKey();

        if (!StringUtils.hasText(text)) {
            return Collections.emptyList();
        }

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(geocodeBaseUrl)
                    .queryParam("text", text.trim())
                    .queryParam("limit", 6)
                    .queryParam("format", "json")
                    .queryParam("apiKey", apiKey.trim())
                    .build()
                    .toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            List<GeocodeResultDto> results = new ArrayList<>();
            if (response.getBody() != null && response.getBody().get("results") instanceof List) {
                List<?> rawResults = (List<?>) response.getBody().get("results");
                for (Object item : rawResults) {
                    if (item instanceof Map) {
                        Map<?, ?> map = (Map<?, ?>) item;
                        String formatted = (String) map.get("formatted");
                        String city = (String) map.get("city");
                        if (city == null) {
                            city = (String) map.get("name");
                        }
                        String state = (String) map.get("state");
                        String country = (String) map.get("country");
                        Double lat = parseDouble(map.get("lat"));
                        Double lon = parseDouble(map.get("lon"));

                        if (lat != null && lon != null) {
                            results.add(new GeocodeResultDto(formatted, city, state, country, lat, lon));
                        }
                    }
                }
            }
            return results;
        } catch (HttpClientErrorException.Unauthorized ue) {
            logger.error("Geoapify Geocoding API authentication failed: invalid API key.");
            throw new PlacesApiException("Places service authentication failed. Please verify the API key.");
        } catch (HttpClientErrorException.TooManyRequests te) {
            logger.warn("Geoapify Geocoding rate limit exceeded.");
            throw new PlacesApiException("Places service rate limit exceeded. Please wait a moment and try again.");
        } catch (PlacesApiException pe) {
            throw pe;
        } catch (Exception e) {
            logger.error("Error calling Geoapify Geocoding API: {}", e.getMessage());
            throw new PlacesApiException("Places service temporarily unavailable during destination search.", e);
        }
    }

    @Override
    public GeocodeResultDto reverseGeocode(Double latitude, Double longitude) {
        validateApiKey();

        if (latitude == null || longitude == null) {
            return null;
        }

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(reverseGeocodeBaseUrl)
                    .queryParam("lat", latitude)
                    .queryParam("lon", longitude)
                    .queryParam("format", "json")
                    .queryParam("apiKey", apiKey.trim())
                    .build()
                    .toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getBody() != null && response.getBody().get("results") instanceof List) {
                List<?> rawResults = (List<?>) response.getBody().get("results");
                if (!rawResults.isEmpty() && rawResults.get(0) instanceof Map) {
                    Map<?, ?> map = (Map<?, ?>) rawResults.get(0);
                    String formatted = (String) map.get("formatted");
                    String city = (String) map.get("city");
                    if (city == null) {
                        city = (String) map.get("name");
                    }
                    String state = (String) map.get("state");
                    String country = (String) map.get("country");
                    return new GeocodeResultDto(formatted, city, state, country, latitude, longitude);
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
            logger.warn("Reverse geocode failed: {}. Using coordinate fallback.", e.getMessage());
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

        // Destination-wide search radius: 25,000m (25 km) default
        int radius = (radiusMeters != null && radiusMeters > 0) ? radiusMeters : 25000;

        // If Explore All is selected, fetch all 5 categories to guarantee complete, balanced results
        if (category == null || category.trim().isEmpty() || "all".equalsIgnoreCase(category.trim())) {
            return fetchExploreAllCombined(latitude, longitude, radius);
        }

        // Single Category Search
        int maxLimit = (limit != null && limit > 0) ? Math.min(limit, 60) : 50;
        return querySingleCategory(latitude, longitude, category, radius, maxLimit);
    }

    /**
     * Combines Hotels, Restaurants, Attractions, Hospitals, and Police for destination-wide Explore All.
     */
    private List<PlaceDto> fetchExploreAllCombined(Double latitude, Double longitude, int radius) {
        List<PlaceDto> combinedList = new ArrayList<>();
        Set<String> seenIds = new HashSet<>();

        String[] coreCategories = {"attractions", "hotels", "restaurants", "hospitals", "police"};

        for (String cat : coreCategories) {
            try {
                // Fetch top 12 per category for Explore All
                List<PlaceDto> catPlaces = querySingleCategory(latitude, longitude, cat, radius, 12);
                for (PlaceDto p : catPlaces) {
                    String uniqueKey = p.getName().toLowerCase().trim() + "_" + Math.round(p.getLatitude() * 1000) + "_" + Math.round(p.getLongitude() * 1000);
                    if (seenIds.add(p.getId()) && seenIds.add(uniqueKey)) {
                        combinedList.add(p);
                    }
                }
            } catch (Exception e) {
                logger.warn("Category query for '{}' encountered non-fatal error: {}", cat, e.getMessage());
            }
        }

        logger.info("Explore All combined total: {} places around ({}, {})", combinedList.size(), latitude, longitude);
        return combinedList;
    }

    private List<PlaceDto> querySingleCategory(Double latitude, Double longitude, String category, int radius, int limit) {
        String geoapifyCategories = mapToGeoapifyCategories(category);

        try {
            String filterParam = String.format(Locale.US, "circle:%f,%f,%d", longitude, latitude, radius);
            String biasParam = String.format(Locale.US, "proximity:%f,%f", longitude, latitude);

            URI uri = UriComponentsBuilder.fromHttpUrl(placesBaseUrl)
                    .queryParam("categories", geoapifyCategories)
                    .queryParam("filter", filterParam)
                    .queryParam("bias", biasParam)
                    .queryParam("limit", limit)
                    .queryParam("apiKey", apiKey.trim())
                    .build()
                    .toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            List<PlaceDto> places = new ArrayList<>();
            if (response.getBody() != null && response.getBody().get("features") instanceof List) {
                List<?> features = (List<?>) response.getBody().get("features");
                for (Object item : features) {
                    if (item instanceof Map) {
                        Map<?, ?> feature = (Map<?, ?>) item;
                        PlaceDto place = parseGeoapifyFeature(feature, category);
                        if (place != null) {
                            if ("attraction".equalsIgnoreCase(place.getCategory())) {
                                enrichAttractionWithWikipedia(place);
                            }
                            places.add(place);
                        }
                    }
                }
            }
            return places;
        } catch (HttpClientErrorException.Unauthorized ue) {
            logger.error("Geoapify Places API 401 Unauthorized.");
            throw new PlacesApiException("Places service authentication failed. Please check the configured API key.");
        } catch (HttpClientErrorException.TooManyRequests te) {
            logger.warn("Geoapify Places API 429 Rate Limit.");
            throw new PlacesApiException("Places API rate limit reached. Please wait a few seconds and try again.");
        } catch (HttpClientErrorException.BadRequest be) {
            logger.error("Geoapify Places API 400 Bad Request: {}", be.getResponseBodyAsString());
            return Collections.emptyList();
        } catch (PlacesApiException pe) {
            throw pe;
        } catch (Exception e) {
            logger.error("Error querying Geoapify Places API for category '{}': {}", category, e.getMessage());
            throw new PlacesApiException("Places are temporarily unavailable. Please try again.", e);
        }
    }

    @Override
    public PlaceDto getPlaceDetails(String placeId) {
        validateApiKey();
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl("https://api.geoapify.com/v2/place-details")
                    .queryParam("id", placeId)
                    .queryParam("apiKey", apiKey.trim())
                    .build()
                    .toUri();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getBody() != null && response.getBody().get("features") instanceof List) {
                List<?> features = (List<?>) response.getBody().get("features");
                if (!features.isEmpty() && features.get(0) instanceof Map) {
                    PlaceDto place = parseGeoapifyFeature((Map<?, ?>) features.get(0), null);
                    if (place != null && "attraction".equalsIgnoreCase(place.getCategory())) {
                        enrichAttractionWithWikipedia(place);
                    }
                    return place;
                }
            }
            throw new PlacesApiException("Place details not found for id: " + placeId);
        } catch (PlacesApiException pe) {
            throw pe;
        } catch (Exception e) {
            logger.error("Error getting Geoapify place details: {}", e.getMessage());
            throw new PlacesApiException("Places service temporarily unavailable.", e);
        }
    }

    /**
     * Enriches tourist attractions with rich Wikipedia summary, article link, and lead thumbnail.
     */
    private void enrichAttractionWithWikipedia(PlaceDto place) {
        if (place == null) return;
        if (place.getImageUrl() != null && place.getDescription() != null && place.getDescription().length() > 100) return;

        try {
            String name = place.getName();
            if (!StringUtils.hasText(name) || "Unnamed Location".equalsIgnoreCase(name)) return;

            // Clean title: remove parenthetical suffixes or address words
            String cleanTitle = name.replaceAll("\\(.*?\\)", "").replaceAll("[^a-zA-Z0-9 ]", "").trim();
            if (cleanTitle.length() < 3) return;

            String encoded = URLEncoder.encode(cleanTitle.replace(" ", "_"), StandardCharsets.UTF_8.toString());
            String wikiApiUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encoded;

            ResponseEntity<Map<String, Object>> wikiRes = restTemplate.exchange(
                    URI.create(wikiApiUrl),
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (wikiRes.getBody() != null) {
                Map<?, ?> body = wikiRes.getBody();
                if (body.get("extract") instanceof String) {
                    String extract = (String) body.get("extract");
                    if (extract.length() > 600) {
                        extract = extract.substring(0, 600) + "...";
                    }
                    place.setDescription(extract);
                }

                if (body.get("content_urls") instanceof Map) {
                    Map<?, ?> urls = (Map<?, ?>) body.get("content_urls");
                    if (urls.get("desktop") instanceof Map) {
                        Map<?, ?> desktop = (Map<?, ?>) urls.get("desktop");
                        if (desktop.get("page") instanceof String) {
                            place.setWikipediaUrl((String) desktop.get("page"));
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
            }
        } catch (Exception ignored) {
            // Gracefully keep provider information if Wikipedia article is not found
        }
    }

    private String mapToGeoapifyCategories(String category) {
        if (category == null || category.trim().isEmpty() || "all".equalsIgnoreCase(category)) {
            return "tourism.sights,tourism.attraction,heritage,entertainment.museum,building.historic," +
                   "accommodation.hotel,accommodation.motel,accommodation.hostel,accommodation.guest_house,accommodation.resort," +
                   "catering.restaurant,catering.fast_food,catering.cafe,catering.bakery," +
                   "healthcare.hospital," +
                   "service.police";
        }

        switch (category.toLowerCase().trim()) {
            case "attractions":
            case "attraction":
                return "tourism.sights,tourism.attraction,heritage,entertainment.museum,building.historic,leisure.park,natural";
            case "hotels":
            case "hotel":
                return "accommodation.hotel,accommodation.motel,accommodation.hostel,accommodation.guest_house,accommodation.resort";
            case "restaurants":
            case "restaurant":
                return "catering.restaurant,catering.fast_food,catering.cafe,catering.bakery";
            case "hospitals":
            case "hospital":
                return "healthcare.hospital";
            case "police":
                return "service.police";
            default:
                return "tourism.sights,accommodation.hotel,catering.restaurant,healthcare.hospital,service.police";
        }
    }

    private PlaceDto parseGeoapifyFeature(Map<?, ?> feature, String requestedCategory) {
        Map<?, ?> properties = (Map<?, ?>) feature.get("properties");
        if (properties == null) {
            return null;
        }

        String placeId = (String) properties.get("place_id");
        if (placeId == null) {
            placeId = UUID.randomUUID().toString();
        }

        String name = (String) properties.get("name");
        if (!StringUtils.hasText(name)) {
            name = (String) properties.get("formatted");
            if (!StringUtils.hasText(name)) {
                name = (String) properties.get("street");
            }
        }
        if (!StringUtils.hasText(name)) {
            name = "Unnamed Location";
        }

        Double lat = parseDouble(properties.get("lat"));
        Double lon = parseDouble(properties.get("lon"));

        if (lat == null || lon == null) {
            Map<?, ?> geometry = (Map<?, ?>) feature.get("geometry");
            if (geometry != null && geometry.get("coordinates") instanceof List) {
                List<?> coords = (List<?>) geometry.get("coordinates");
                if (coords.size() >= 2) {
                    lon = parseDouble(coords.get(0));
                    lat = parseDouble(coords.get(1));
                }
            }
        }

        if (lat == null || lon == null) {
            return null;
        }

        List<String> rawCategories = new ArrayList<>();
        if (properties.get("categories") instanceof List) {
            List<?> cats = (List<?>) properties.get("categories");
            for (Object c : cats) {
                if (c instanceof String) {
                    if (!((String) c).toLowerCase().contains("laboratory") && !((String) c).toLowerCase().contains("lab")) {
                        rawCategories.add((String) c);
                    }
                }
            }
        }

        String normalizedCategory = determineNormalizedCategory(rawCategories, requestedCategory);
        String subCategory = determineSubCategory(rawCategories, properties);

        PlaceDto place = new PlaceDto();
        place.setId(placeId);
        place.setName(name);
        place.setCategory(normalizedCategory);
        place.setSubCategory(subCategory);
        place.setCategories(rawCategories);
        place.setLatitude(lat);
        place.setLongitude(lon);
        place.setAddress((String) properties.get("formatted"));
        place.setCity((String) properties.get("city"));
        place.setCountry((String) properties.get("country"));

        Map<?, ?> contact = (Map<?, ?>) properties.get("contact");
        if (contact != null) {
            place.setPhone((String) contact.get("phone"));
        }
        if (place.getPhone() == null) {
            place.setPhone((String) properties.get("phone"));
        }

        place.setWebsite((String) properties.get("website"));
        place.setOpeningHours((String) properties.get("opening_hours"));

        if (properties.get("rating") != null) {
            place.setRating(parseDouble(properties.get("rating")));
        }

        List<String> amenities = extractRealAmenities(properties);
        if (!amenities.isEmpty()) {
            place.setAmenities(amenities);
        }

        // Real photos from Geoapify datasource
        String imageUrl = null;
        if (properties.get("image") instanceof String) {
            imageUrl = (String) properties.get("image");
        } else if (properties.get("photos") instanceof List && !((List<?>) properties.get("photos")).isEmpty()) {
            Object firstPhoto = ((List<?>) properties.get("photos")).get(0);
            if (firstPhoto instanceof Map) {
                imageUrl = (String) ((Map<?, ?>) firstPhoto).get("url");
            } else if (firstPhoto instanceof String) {
                imageUrl = (String) firstPhoto;
            }
        } else if (properties.get("wiki_and_media") instanceof Map) {
            Map<?, ?> wiki = (Map<?, ?>) properties.get("wiki_and_media");
            if (wiki.get("image") instanceof String) {
                imageUrl = (String) wiki.get("image");
            }
        }
        place.setImageUrl(imageUrl);

        // Real description
        String description = null;
        String wikipediaUrl = null;
        if (properties.get("description") instanceof String) {
            description = (String) properties.get("description");
        } else if (properties.get("details") instanceof String) {
            description = (String) properties.get("details");
        }

        if (properties.get("wiki_and_media") instanceof Map) {
            Map<?, ?> wiki = (Map<?, ?>) properties.get("wiki_and_media");
            if (description == null && wiki.get("description") instanceof String) {
                description = (String) wiki.get("description");
            }
            if (wiki.get("wikipedia") instanceof String) {
                wikipediaUrl = (String) wiki.get("wikipedia");
            } else if (wiki.get("wikidata") instanceof String) {
                wikipediaUrl = "https://www.wikidata.org/wiki/" + wiki.get("wikidata");
            }
        }
        if (properties.get("wikipedia") instanceof String) {
            wikipediaUrl = (String) properties.get("wikipedia");
        }

        place.setDescription(description);
        place.setWikipediaUrl(wikipediaUrl);

        if (properties.get("catering") instanceof Map) {
            Map<?, ?> catering = (Map<?, ?>) properties.get("catering");
            if (catering.get("cuisine") instanceof String) {
                place.setCuisine((String) catering.get("cuisine"));
            }
        } else if (properties.get("cuisine") instanceof String) {
            place.setCuisine((String) properties.get("cuisine"));
        }

        if (properties.get("accommodation") instanceof Map) {
            Map<?, ?> accom = (Map<?, ?>) properties.get("accommodation");
            if (accom.get("type") instanceof String) {
                place.setAccommodationType((String) accom.get("type"));
            }
        }

        if (properties.get("price_level") != null) {
            place.setPriceLevel(String.valueOf(properties.get("price_level")));
        }

        return place;
    }

    private String determineNormalizedCategory(List<String> categories, String requestedCategory) {
        if (StringUtils.hasText(requestedCategory) && !"all".equalsIgnoreCase(requestedCategory)) {
            return requestedCategory.toLowerCase();
        }

        for (String cat : categories) {
            String lower = cat.toLowerCase();
            if (lower.startsWith("healthcare.hospital") || lower.contains("hospital")) {
                return "hospital";
            }
            if (lower.startsWith("service.police") || lower.contains("police")) {
                return "police";
            }
            if (lower.startsWith("accommodation") || lower.contains("hotel") || lower.contains("motel") || lower.contains("hostel")) {
                return "hotel";
            }
            if (lower.startsWith("catering") || lower.contains("restaurant") || lower.contains("cafe") || lower.contains("food")) {
                return "restaurant";
            }
            if (lower.startsWith("tourism") || lower.startsWith("heritage") || lower.startsWith("entertainment") || lower.contains("sights") || lower.contains("attraction")) {
                return "attraction";
            }
        }
        return "attraction";
    }

    private String determineSubCategory(List<String> categories, Map<?, ?> properties) {
        for (String cat : categories) {
            String lower = cat.toLowerCase();
            if (lower.contains("museum")) return "Museum";
            if (lower.contains("heritage") || lower.contains("historic")) return "Heritage Site";
            if (lower.contains("worship") || lower.contains("temple") || lower.contains("church") || lower.contains("mosque")) return "Religious Site";
            if (lower.contains("monument")) return "Monument";
            if (lower.contains("fort") || lower.contains("castle")) return "Fort / Palace";
            if (lower.contains("park") || lower.contains("garden")) return "Park & Nature";
            if (lower.contains("viewpoint")) return "Viewpoint";
            if (lower.contains("hostel")) return "Hostel";
            if (lower.contains("motel")) return "Motel";
            if (lower.contains("resort")) return "Resort";
            if (lower.contains("guest_house")) return "Guest House";
            if (lower.contains("cafe") || lower.contains("coffee")) return "Cafe";
            if (lower.contains("bakery")) return "Bakery";
            if (lower.contains("fast_food")) return "Fast Food";
        }
        return null;
    }

    private List<String> extractRealAmenities(Map<?, ?> properties) {
        List<String> amenities = new ArrayList<>();
        Map<?, ?> facilities = (Map<?, ?>) properties.get("facilities");
        if (facilities != null) {
            for (Map.Entry<?, ?> entry : facilities.entrySet()) {
                if (Boolean.TRUE.equals(entry.getValue())) {
                    amenities.add(String.valueOf(entry.getKey()));
                }
            }
        }
        return amenities;
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

    @Override
    public byte[] getPhotoBytes(String photoReference, Integer maxWidth) {
        return null;
    }
}
