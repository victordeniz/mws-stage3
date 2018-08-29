let restaurant;
let newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", (event) => {
    initMap();
});

/**
 * Initialize leaflet map
 */
const initMap = () => {
    fetchRestaurantFromURL()
        .then(restaurant => {
            self.newMap = L.map("map", {
                center: [restaurant.latlng.lat, restaurant.latlng.lng],
                zoom: 16,
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
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        })
        .catch(error => console.error(error));
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
    if (self.restaurant) { // restaurant already fetched!
        return Promise.resolve(self.restaurant);
    }
    const id = parseInt(getParameterByName("id"));
    if (!id || id === NaN) { // no id found in URL
        return Promise.reject("No restaurant id in URL")
    } else {
        return DBHelper.fetchRestaurantById(id)
            .then(restaurant => {
                if (!restaurant) {
                    return Promise.reject(`Restaurant with ID ${id} was not found`)
                }
                self.restaurant = restaurant;
                fillRestaurantHTML();
                return restaurant;
            });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById("restaurant-name");
    name.innerHTML = restaurant.name;

    const address = document.getElementById("restaurant-address");
    address.innerHTML = restaurant.address;

    const image = document.getElementById("restaurant-img");
    image.className = "restaurant-img"
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = `${restaurant.name} image`;
    image.setAttribute("arial-hidden", "true");
    let imgNameParts = image.src.split(".");
    image.srcset = `${imgNameParts[0]}-small.${imgNameParts[1]} 200w, ${imgNameParts[0]}-large.${imgNameParts[1]} 800w`;
    image.sizes = "(max-width: 767px) 100vw, 10vw";

    const cuisine = document.getElementById("restaurant-cuisine");
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById("restaurant-hours");
    for (let key in operatingHours) {
        const row = document.createElement("tr");

        const day = document.createElement("td");
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement("td");
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById("reviews-container");
    const title = document.createElement("h2");
    title.innerHTML = "Reviews";
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement("p");
        noReviews.innerHTML = "No reviews yet!";
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById("reviews-list");
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = review => {
    const li = document.createElement("li");
    const name = document.createElement("p");
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement("p");
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement("p");
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement("p");
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById("breadcrumb");
    const li = document.createElement("li");
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
};

