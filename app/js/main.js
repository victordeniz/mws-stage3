let restaurants,
    neighborhoods,
    cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", (event) => {
    fetchNeighborhoods();
    fetchCuisines();
    initMap(); // added
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods()
        .then(neighborhoods => {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        })
        .catch(error => console.error(error));
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById("neighborhoods-select");
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement("option");
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
    DBHelper.fetchCuisines()
        .then(cuisines => {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        })
        .catch(error => console.log(error));
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById("cuisines-select");

    cuisines.forEach(cuisine => {
        const option = document.createElement("option");
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
    self.newMap = L.map("map", {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
    });
    L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}", {
        mapboxToken: "pk.eyJ1Ijoidm1kZWYiLCJhIjoiY2psOGhzdTV0MzdzNzN3bTYycG5zbDdkeiJ9.qUBL31RC9xN0eRPaYQ0V7g",
        maxZoom: 18,
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, " +
            "<a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, " +
            "Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        id: "mapbox.streets"
    }).addTo(newMap);

    updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
    const cSelect = document.getElementById("cuisines-select");
    const nSelect = document.getElementById("neighborhoods-select");

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;
    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
        .then(restaurants => {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        })
        .catch(error => console.error(error));
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById("restaurants-list");
    ul.innerHTML = "";

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(marker => marker.remove());
    }
    self.markers = [];
    self.restaurants = restaurants;
};


const fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById("restaurants-list");
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
    const li = document.createElement("li");

    const image = document.createElement("img");
    image.className = "restaurant-img";
    image.alt = `${restaurant.name} image`;
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.setAttribute("arial-hidden", "true");
    let imgNameParts = image.src.split(".");
    image.srcset = `${imgNameParts[0]}-small.${imgNameParts[1]} 200w, ${imgNameParts[0]}-large.${imgNameParts[1]} 800w`;
    image.sizes = "(max-width: 767px) 100vw, 10vw";
    li.append(image);

    const name = document.createElement("h3");
    name.innerHTML = restaurant.name;
    li.append(name);

    const favourite = document.createElement("button");
    favourite.innerHTML = "❤";
    favourite.classList.add("fav_btn");
    //change fav status on click
    favourite.onclick = function() {
        const isFavNow = !restaurant.is_favorite;
        DBHelper.updateFavouriteStatus(restaurant.id, isFavNow);
        restaurant.is_favorite = !restaurant.is_favorite
        changeFavElementClass(favourite, restaurant.is_favorite)
    };
    changeFavElementClass(favourite, restaurant.is_favorite)
    li.append(favourite);

    const neighborhood = document.createElement("p");
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement("p");
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement("a");
    more.innerHTML = "View Details";
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more)

    return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
        marker.on("click", onClick);

        function onClick() {
            window.location.href = marker.options.url;
        }

        self.markers.push(marker);
    });
}

/**
 * Toggle favorite restaurant
 * @param el HTML element to modify
 * @param fav Favorite condition
 */
const changeFavElementClass = (el, fav) => {
    if (!fav) {
        el.classList.remove("favorite_yes");
        el.classList.add("favorite_no");
        el.setAttribute("aria-label", "mark as favorite");

    } else {
        el.classList.remove("favorite_no");
        el.classList.add("favorite_yes");
        el.setAttribute("aria-label", "remove as favorite");

    }
}