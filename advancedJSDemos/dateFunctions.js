/* Find the text elements we'll update */
let dateNowResult = document.getElementById("dateNowSpan");
let systemDateResult = document.getElementById("systemDateSpan");
let currentTimezoneResult = document.getElementById("currentTimezoneSpan");
let currentMonthResult = document.getElementById("currentMonthSpan");
let lastClickResult = document.getElementById("lastClickSpan");
let dateSetResult = document.getElementById("dateSetSpan");
let daysDifferenceResult = document.getElementById("daysDifferenceSpan");

/* globally scope our currentDate variable and set it initially */
/* Date.now() returns Milliseconds since January 1, 1970, UTC: universal coordinated time */
let currentDate = Date.now();

/* 
whenever we run this function it will update our currentDate variable and change information
based on its result
 */
function checkDate(){
  /* we will need to know what the time was the last time we ran this function so we store it here */
  let lastClickTime = currentDate;
  /* because we will then update the variable to be current */
  currentDate = Date.now();
  dateNowResult.textContent = currentDate;
  /* convert the ms value into a readible format : this is the date object */
  let systemDate =  new Date(currentDate);
  systemDateResult.textContent = systemDate;
  /* based on the date object we can find the timezone offset in minutes */
  let currentTimeZone = systemDate.getTimezoneOffset();
  currentTimezoneResult.textContent = currentTimeZone;
  /* we can also calculate individual elements such as the month */
  let currentMonth = systemDate.getMonth();
  currentMonthResult.textContent = currentMonth;
  /* 
  finally by subtracting our last click time from the currentDate we can work out how
  many ms between clicks
  */  
  lastClickResult.textContent = currentDate - lastClickTime;
}

/* add eventlistener to button */
document.getElementById("checkDateTimeBtn").addEventListener("click", checkDate);

/* 
This takes the datetime-local input and displays its output value
*/
function setDate(e){
  /* find input element value */
  let setDate = e.target.value;
  dateSetResult.textContent = setDate;
  /* calculate difference between input value and current date */
  /* note that we actually need to convert the value to a date object */
  /* we can see in the browser the original format of the value */
  let timeDiff = Date.now() - new Date(setDate);
  /* we can also do some maths on the ms to convert to a day value */
  let daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  daysDifferenceResult.textContent = daysDiff;
}

/* add eventlistener to button */
document.getElementById("setDateTimeInput").addEventListener("input", setDate);