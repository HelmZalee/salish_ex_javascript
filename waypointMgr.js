
/*****************************************************************************************
 This javascript file was cut from dynaflow3.html.
 It does the initial definition of MYSTUFF and must therefore be the FIRST include.
 It originally contained getCurrentData, which was run by the initialize() function.  
 A function equivalent to getCurrentData is now contained in getCurData.js
 
 Conventions:
 Headings are degrees-from-due-north.  CW is positive.
 Cartesian angles: degrees-from-due-east, CCW is positive
 Radians: Radians should be equivalent to Cartesian angles.
 
/******************************************************************************************/
console.log("begin parsing waypointMgr.js");

MYSTUFF.posToText = function(pos) {
    return pos.left + ", " + pos.top;
};

MYSTUFF.renumberWayPts = function() {
//Purpose: User may delete waypoints.  If he does, renumber them.
    var next = 0; 
    var min = Math.pow(10,10);
    var waypts = $(".waypt");
   
    $(".waypt").each(function(index) {
        if ($(this).text() < min) { 
            minEl = $(this);
            min = minEl.text();
        }
   });
   alert("min is " + min);
   return;
};

MYSTUFF.round = function (number, digitsROD) {
    var exp = Math.pow(10,digitsROD);
    return parseFloat(Math.round(number * exp) / exp).toFixed(digitsROD);
};

MYSTUFF.createCoursePt = function(x,y,time) {

}

MYSTUFF.reportLatLong = function(event) {
    var position = MYSTUFF.eventXyToChartXy(event)
    var latlong = MYSTUFF.xyToLatLong(position);
    var latitude = MYSTUFF.round(latlong.lat,3);
    var longitude = MYSTUFF.round(latlong.lon,3);
    $("#chartX").val(longitude +    "°, x=" + Math.floor(position.x ) + ", scroll x="  );
    $("#chartY").val(latitude + "°, y=" + Math.floor(position.y ) + ", scroll y=" );
    };
