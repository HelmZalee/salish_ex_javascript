if (MYSTUFF === undefined) {
        alert("MYSTUFF undefined in chartCourse: loaded out of order?");
        MYSTUFF = {};
        }
MYSTUFF.chartCourse = function() {
/********************      
  Purpose: Connect the waypoints with tracks.  Invoked by button.  
  NOTE: a verions of chartCourse, chartCourse1, was planned to be a js implementation that
        got current data through Ajax requests.
        
        This verion is planned to request a course from one waypoint to the next.  I do this
        to (1) offload computing to the server, and hide the raw data and computations while
        (2) allowing me to show the user the "progress" as the course is extended to the
        next waypoint.
  
  NOTE a definition of the function "addTrack" preceeds executable code in this function.
  This function "returns" after the first call to getCurrentData.
  The js engine will continue to call getCurrentData until all waypoints have been processed or "fail" has occurred.
  Initially I did this by iterating through a jQuery collection of waypoints.  I think it is safer to explicitly
  fetch waypt1, waypt2, etc. because the proper sequence is guaranteed.
*******************/
    MYSTUFF.chartDatum.length = 0;    //initialize here so there is no old data hanging around.
    var chartDatum = MYSTUFF.chartDatum;
    var nPt;
    var latLong;
    var fail = function(pointId, status, error) {
        alert("failed with status = " + status + " and error = " + error);//status = parsererror, error = SyntaxError: JSON.parse: unexpected character
          };
     var current_pages;
     var getPages = function(chartDatum ) {
        MYSTUFF.getCurrentPages(chartDatum, chartDatum[nPt].t, addTrack, onFail);
     };
    var addTrack = function(chartDatum, currentData) {
/*****************************************************
      Code here steps from waypoint nPt to nPt-1 in intervals to the distance between known points or to the next waypoint, depending
      on:
        - Time to get to the next waypoint.  If more than one hour,
          intermediate points must be used in order to capture the
          change in current flow.
        - Distance to the next waypoint.  If more than half the distance
          to the next current grid, position must be recalculated as
          the vessel enters the next grid
     
     Save for the first invocation, the argument chartDatum is a
     dataset returned by the php code responding to the Ajax call
     that getTrack makes.  This includes CPT1 = current point index,
     CS = current speed, CD = current direction, VH = vessel heading,
     VMG = Vessel velocity component in the direction of the next
     waypoint.
*****************************************************/
        if (nPt > 1) {
            MYSTUFF.reportTrack(chartDatum);
            }
            
        if ( $("#waypt" + (nPt+1)).length > 0) {
            nPt += 1;
            latLong =  MYSTUFF.getWayPtLatLong($("#waypt" + nPt));
            chartDatum[nPt] = {lat:latLong.lat, lon:latLong.lon};
/****************************************************
        code here should construct pageId for the next point
*****************************************************/
           MYSTUFF.getTrack(nPt, chartDatum, addTrack, fail);
            }
      };
 
/*************
  code here gets pointId for first waypoint
***************/
    nPt = 1;
    chartDatum[nPt] = {};
    try  {
    chartDatum[nPt].t = Math.round(MYSTUFF.getDate("startDate", "startTime").getTime()/1000);
    
    latLong = MYSTUFF.getWayPtLatLong($("#waypt1"));
    chartDatum[nPt].lat = latLong.lat;
    chartDatum[nPt].lon = latLong.lon;
    addTrack(MYSTUFF.chartDatum);
   } catch (e) {
//  Consider invoking a single general error handler that tests the type of "e"
        if (typeof e === UserException) {
            alert(e.message);
            } else {
            alert("js error: "  + e.message + "\n" + "file name:"  + e.filename + ", line "  + e.linenumber);//some properties of e may be Mozilla only.  
            }
        }
    };


MYSTUFF.reportTrack = function(track) {
    var s = "Track Report:\n";
    var delim = "";
    for (prop in track) {
        if (track.hasOwnProperty(prop)) {
            s = s + delim  + prop + " = " + track[prop];
            delim = "\n";
            }
    }
    alert("Tracks:" + s);
};
    
MYSTUFF.getWayPtLatLong  = function(element) {
/*********************************************************************************
*   Return object with properties lat and lon: latitude/longitude of given (waypoint) element.    
* //Eventually this should get "region" and "page" as well as lat/long
* //DEPENDS on createWaypoint putting the ULC of a <div> at the (x,y) location of the waypoint.
* //VISUALLY, the image marking a waypoint sb centered on that ULC.  
*********************************************************************************/
        var c = $("#chartScroll");
        var xy = {};
        xy = element.position();
        xy.x = xy.left + c.scrollLeft(); //? do i need this?
        xy.y = xy.top;
        return MYSTUFF.xyToLatLong(xy);//{lat:~, lon:~}
}
MYSTUFF.correctedVesselHeading = function(vb, vc, thetaCRad, thetaTRad) {
/*  Calculate the vessel heading required to stay on a track, given:
     - vessel speed over water (vb), kts
     - current magnitude vc, kts
     - current heading (thetaC), and  
     - the desired track heading thetaT
    Headings are in degrees from to true N (CW positive).

   See my Converting Pixel Coordinates to Latitude and Longitude.doc
   and course.xls, tab "Test Case 2 Use Nav"  
*/
    var sinT = Math.sin(thetaTRad);
    var cosT = Math.cos(thetaTRad);
    var gamma = (vc/vb)*Math.sin(thetaCRad - thetaTRad);//same as thetaC - thetaT?
//var a = 1; don't need to multiply anything by 1!    
    var b = -2*gamma*sinT;
    var c = gamma*gamma - cosT*cosT;
    // roots are cosine of the angle of the boat's heading wrt East (not the heading)
    var rootp = (-b + Math.sqrt(b*b - 4*c))/(2);    //root - positive branch
    var rootn  = (-b - Math.sqrt(b*b - 4*c))/(2);   //root - negative branch
    
//Now we have to decide which of the two solutions is the track:
    var thetaBp = Math.acos(rootp);                           //Boat heading thetaBp (positive solution)
    var trackPvEast = vc*Math.sin(thetaCRad) +vb*Math.sin(thetaBp);       //Easterly component of speed along track (Positive solution)
    var trackPvNorth = vc*Math.cos(thetaCRad) + vb*Math.cos(thetaBp);   // Northerly component of speed along track
    var trackPDir = Math.atan2(trackPvEast, trackPvNorth);       //Cartesian direction of track
    var speedP = Math.sqrt(trackPvNorth*trackPvNorth + trackPvEast*trackPvEast);
    
    var thetaBn = Math.acos(rootn);                                 //Boat heading
    var trackNvEast = vc*Math.sin(thetaCRad) +vb*Math.sin(thetaBn);       // Easterly component of hdg (Negative solution)
    var trackNvNorth = vc*Math.cos(thetaCRad) + vb*Math.cos(thetaBn);  
    var trackNDir = Math.atan2(trackNvEast, trackNvNorth);
    var speedN = Math.sqrt(trackNvNorth*trackNvNorth + trackNvEast*trackNvEast);
    // Accept the result giving a track nearest the desired track:
    if (Math.abs(thetaTRad - trackNDir) < Math.abs(thetaTRad - trackPDir)) {
        return {boatHeading: thetaBn, trackSpeed: speedN};
    } else {
        return{boatHeading: thetaBp, trackSpeed: speedP};
        }
/////////////////////////////
    
    var cosineToNav = function(cos) {
    // convert cosine of direction to heading in degrees
        return  (360 + (90 - Math.acos(cart)/MYSTUFF.radPerDeg))%360;
    }
}