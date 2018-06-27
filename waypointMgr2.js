
/*****************************************************************************************
 Derived from waypointMgr.js 1 March 2018
 
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
    var el = document.getElementById("cursorInfo");
    var position = MYSTUFF.eventXyToChartXy(event)
    var latlong = MYSTUFF.xyToLatLong(position);
    var latitude = MYSTUFF.round(latlong.lat,3);
    var longitude = MYSTUFF.round(latlong.lon,3);
    var target = event.target.id;
    var nodes = mycode.findNearestNode(position.x, position.y);
    for (var i = 0; i < el.childNodes.length; i++){
      if (el.childNodes[i].nodeName = Node.TEXT_NODE) {
        el.childNodes[i].nodeValue = "Cursor location: " + 
        MYSTUFF.round(latlong.lat,3) + "°N, " + MYSTUFF.round(latlong.lon,3) + "°W " +
        "(x " + Math.trunc(position.x + 0.5) + ", y " + Math.trunc(position.y + 0.5) +
        "). Nearest current @ (x, y) = (" + nodes.nodes[0].X + ", " + nodes.nodes[0].Y + "), " + Math.trunc(nodes.minDist[0]) + "m";
        return;
      }
    }
  };
/* MYSTUFF.reportLatLong2 = function(event) {
    var position = MYSTUFF.eventXyToChartXy(event)
    var latlong = MYSTUFF.xyToLatLong(position);
    var latitude = MYSTUFF.round(latlong.lat,3);
    var longitude = MYSTUFF.round(latlong.lon,3);
    var target = event.target.id;
    $("#chartX").val(longitude + "°" +" (" + position.x +")");
    $("#chartY").val(latitude  + "°" +" (" + position.y +")");
    }; */