/* Find the text elements we'll update */
let locationResult = document.getElementById("locationSpan");
let addressResult = document.getElementById("addressSpan");
let weatherResult = document.getElementById("weatherSpan");
let tempResult = document.getElementById("tempSpan");

/* predefine the settings of our location finding */
const locationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
}

/* our baseline function : running this will prompt user permission */
function checkLocation(){
  /* we need to pass this function three different parameters */
  /* foundLocation callback function for sucessful location finding */
  /* locationError callback function for unsucessful location finding */
  /* and the locationOptions we difined above */
  navigator.geolocation.getCurrentPosition(foundLocation, locationError, locationOptions);
}

/* like our event functions this callback automatically receives a parameter */
/* in our case it is an object that we're calling pos */
function foundLocation(pos){
  /* objects don't print easily to the browser so we're going to look at in console */
  console.log(pos);
  /* we can however find parts of the object : here we're pulling out its lat and long */
  locationResult.textContent = `${pos.coords.latitude}, ${pos.coords.longitude}`;
  /* then if we can find this information we're passing it on to two further functions */
  getMapData(pos.coords.latitude, pos.coords.longitude);
  getWeatherData(pos.coords.latitude, pos.coords.longitude);
}

/* like our event functions this callback automatically receives a parameter */
/* in our case it is an object that we're calling err */
function locationError(err) {
  /* here we're printing to the console what the error is */
  console.warn(`ERROR(${err.code}): ${err.message}`);
  // alert("location error");
}

/* here we're using a new keyword async : much too long to explain here but ref in modules */
/* tldr is we use them when we have to wait for a reply : in this case from our API */
async function getMapData(lat, long){
  /* first we need to define what url we're sending the long and lat to */
  /* there's other ways to access APIs, but in this case we can embed our long and lat within the URL */
  const url = `https://nominatim.openstreetmap.org/reverse?format=geojson&lat=${lat}&lon=${long}`;
  /* next we try to make the connection the the defined URL */
  try {
    const response = await fetch(url);
    /* if we get an error with our response print to console */
    /* this is usually connected but with error */
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    /* otherwise find the result of our response */
    const result = await response.json();
    /* our result is in the JSON format : a type of object */
    /* to do something with it we want to parse the information so we pass it to yet another function */
    /* you'll note we're note sending the whole result, only the part we want to use */
    parseMapInfo(result.features[0]);
    // console.log(result);
  } catch (error) {
    /* this is if error with connection */
    console.error(error.message);
  }
}

/* finally we use the info to update our text */
function parseMapInfo(mapFeatures){
  console.log(mapFeatures);
  addressResult.textContent = mapFeatures.properties.display_name;
}

/* this operates much the same as the above but calls a different api */
async function getWeatherData(lat, long){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,weather_code&forecast_days=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const result = await response.json();
    // console.log(result);
    parseWeatherInfo(result);
  } catch (error) {
    console.error(error.message);
  }
}

function parseWeatherInfo(weatherObject){
  tempResult.textContent = weatherObject.current.temperature_2m;
}

/* attach event listener */
document.getElementById("checkLocationBtn").addEventListener("click", checkLocation);