function append_debug(text) {
    var div = document.getElementById("debugOutput");
    var p = document.createElement("p");
    var t = document.createTextNode("");
    p.appendChild(t);
    //div.appendChild(p);
    $("#debugOutput").append(p);
  //  $("#debugOutput").append(p);
  //  $("#debugOutput").append("<p>" + text + "<p>");
    }

//=================================================================================
//From "testJavaScriptFileUpload.html.  This is about 350 lines of code.
var mycode = {
  
  ASCII:{ETX:3, LF:10, CR:13, COMMA:44, SPACE:32,ZERO:48},
  
  serializedTree:"sji_currentpt_2dbtree.bin",
  
  appendP:function(id, text) {
  //Put "text" in a <p>, and append that p to the element with the given id.
    var parent, para, t;
    parent = document.getElementById(id);
    if (parent === null) {
      alert("appendP: Element id = " + id + " not found.");
      return;
    }
    para = document.createElement("P"); 
    t = document.createTextNode(text);
    para.appendChild(t);
    parent.appendChild(para);
  },
  
  replaceP: function(id, text){
//Replace text in <p id=id> with text
  var p, parent, newP, tNode;
  p = document.getElementById(id);
  if (p === null) {
    alert("replaceP: '" + id + "' is not the id of any element.");
    return;
    }
  parent = p.parentNode;
  newP = document.createElement("P");
  tNode = document.createTextNode(text);
  newP.appendChild(tNode);
  parent.removeChild(p);
  newP.id = id;
  parent.appendChild(newP);
  },
  
  stdPointsView:undefined,
  
  root:null,
  
 NODE:class cNode {
    constructor(){
      this.index = 0;
      this.lat = 0;
      this.lon = 0;
    //this.lcIdx = 0;          //unnecessary
    //this.rcIdx = 0;          //unnecessary
      this.parent = null;      //parent will be set by traverese().
      this.nextLeft = null;
      this.nextRight =null;
      this.currents = [];
    }
    distSq(x,y) {
      return (this.lat - y)*(this.lat-y) + (this.lon-x)*(this.lon-x);
      }
    distance(x,y) {
      return Math.sqrt(this.distSq(x,y));
      }
    toString() {
      return this.index + "@(" + this.lat + "," + this.lon + ")";
      }
  },
    
  parseStdPoints: function(){
    var oReq = new XMLHttpRequest();
  /*
    Read file written by build2DTree in kdTree1.xlsm using Option 4.
    
    The first two bytes are a 16-bit representation of the decimal value 1.
    If the FILE order is "bigendian", the first byte will be 0001, the second, 0000.
    If littleendian, the first byte will be 0000, the second, 0001.
    
    real serialized file, 1st 2 bytes 0000 0001:serializedTree4.txt
    test file (a real text file):flowVectorTree serialized.txt
    test file: serializedTreeBinary.txt
     */
    oReq.open("GET",mycode.serializedTree, true) 
    oReq.responseType = "arraybuffer";
    oReq.onload = function (oEvent) {
      var arrayBuffer = oReq.response; // Note: not oReq.responseText
      var one;
      var byte;
      var record;
      var zero=0;
      var s;
      
      mycode.appendP("tree","Got response");
      if (arrayBuffer) {
        mycode.stdPointsView = new DataView(arrayBuffer);
        one = mycode.stdPointsView.getInt16(0,true);
        if (one !== 1) {
          alert("Standard Points file is corrupted.");
        } 
        mycode.stdPointsView.start = 2;
        mycode.root = mycode.deserialize(mycode.stdPointsView);
        if (mycode.root === null) {
          alert("root node is null")
          } else {
          mycode.appendP("tree","root node index: " + mycode.root.index);
          }
        zero = 0; //so debugger doesn't skip here.
        mycode.root.parent = null;
        mycode.root.count = mycode.traverse(mycode.root.parent, mycode.root,zero);  //The zero is an initial count.
        s = "Got " + mycode.root.count + " current points.  Min lat: " + mycode.root.latMin + ", Max lat: " + mycode.root.latMax + ", Min lon: " + mycode.root.lonMin + ", Max lon: " + mycode.root.lonMax;
        mycode.appendP("requestResult", s);
        document.getElementById("btnSearch").disabled=false;
        return;
        }
    }
    mycode.replaceP("requestResult","Sending HTTP Get request for " + mycode.serializedTree);
    oReq.send();  //Arg is ignored for GET requests.
    mycode.appendP("requestResult","Sent request for mycode.serializedTree, which should be a 2D binary tree.");
  },
  
  deserialize: function(oStream) {
    var record;
    var oNode;
    var maxInt16 = 32767;
    if (oStream.EOF) return null;
//  record = mycode.readLine(mycode.stdPointsView);
//  if (record.index > maxInt16) return null; /*VBA, which wrote the file, does not support unsigned integer.*/
//  oNode = new mycode.NODE(record);
//  added two lines:
    oNode = mycode.readLine(mycode.stdPointsView);
    if (oNode.index > maxInt16) return null;
    oNode.leftChild  = mycode.deserialize(oStream);
    oNode.rightChild = mycode.deserialize(oStream);
    return oNode;
  },

  readLine: function(buffer){
    var line;
    var nCurrent, spd, hdg;
    line = new mycode.NODE();
    if (buffer.start >= buffer.byteLength) return mycode.ETX;
    line.index = buffer.getUint16(buffer.start, true),   //Get Uint in anticipation of "enhancing" VBA
    line.lat   = buffer.getUint16(buffer.start+2, true),
    line.lon   = buffer.getUint16(buffer.start+4, true),
  //line.lcIdx =  buffer.getUint16(buffer.start+6, true),
  //line.rcIdx =  buffer.getUint16(buffer.start+8, true),
    line.currents = [] //was spdHdg

    nCurrent = 0;
//  Read 43 Int16 values of SpdHdg at this (lat,lon).  
//  SpdHdg[n] = 10*Heading + Speed, for charts 1 through 43:
    for (buffer.start = buffer.start + 10; nCurrent < 43; buffer.start =buffer.start + 2){
      line.currents[nCurrent++] = buffer.getUint16(buffer.start, true); //"currents" was spdHdg
      }
    return line;
  },
  
  testIterator:function(){
    var iterator;
    mycode.replaceP("searchResult", "Iterator test: ");
    iterator = mycode.iterateOverTree(mycode.root);
    while(iterator.hasNext()){
      mycode.appendP("searchResult", iterator.next().index);
      }
    mycode.appendP("searchResult", "Reached root of tree.");
  },
  
  iterateOverTree: function(root){
  /* 
      Based on John Dvorak's answer @stackoverflow.com/questions/12850889/in-order-iterator-for-binary-tree
      Use: 
        var iterator = iterateOverTree(root);
        while(iterator.hasNext()){
          node = iterator.next()
          // do something with "node"
          }
      Probably could modify my own "traverse" to do this, but don't want to take the time.
  */
    var vertex;
    vertex = root;
//  Setup: initially, vertex is the bottom-leftmost node, as findNearestNode begins:  
    if (vertex == null) return null;
    while(vertex.leftChild !== null) vertex = vertex.leftChild;
    
//  Return an object with two functions, hasNext() and next(), with access to "vertex".  
//  While hasNext returns true, consecutive calls to next() will return a node, marching in the
//  same order as findNearestNode, ie, from bottom left: up, right, down & left...
    return({
      hasNext: function(){
        return vertex != null;
        },
      
      next:function() {
        if (!this.hasNext()) return null;
        r = vertex;
        if (vertex.rightChild !== null) {
          vertex = vertex.rightChild;
          while (vertex.leftChild !== null) vertex = vertex.leftChild;
          return r;
          }
        while(true){
          if (vertex.parent == null) {
            vertex = null;
            return r;
            }
          if(vertex.parent.leftChild === vertex){
            vertex = vertex.parent;
            return r;
            }
          vertex = vertex.parent;
          }
      }
    })
  },
  
  traverse: function(parent, root, count) {
  // Traverse tree to get extrema and count, and to set the parent property so my iterator will work.
  // Invoke with traverse(null, root, count)
    if (count === 0) {
//      count = 0 is first call; initialize extremes of lat, lon:    
        mycode.root.lonMax = 0;
        mycode.root.lonMin = 100000;
        mycode.root.latMax = 0;
        mycode.root.latMin = 100000;
        mycode.root.parent = null;
        }
    if (typeof(root) === 'undefined') {
      alert("At count = " + count + ", Traverse reached undefined node.  Nodes can be null, but not undefined.");
      return count;
      }
    if (root === null) return count;
    root.parent = parent;
    count++;
    if (root.lon > mycode.root.lonMax) {mycode.root.lonMax = root.lon;}
    if (root.lon < mycode.root.lonMin) {mycode.root.lonMin = root.lon;}
    if (root.lat > mycode.root.latMax) {mycode.root.latMax = root.lat;}
    if (root.lat < mycode.root.latMin) {mycode.root.latMin = root.lat;}
  //Ck to see the lcIdx matches the leftChild index, etc.
  //ckLeft(root);
  //ckRight(root);
    count = mycode.traverse(root, root.leftChild, count);
    count = mycode.traverse(root, root.rightChild,count);
    return count;
    
    function ckLeft(node) {
      if ( node.leftChild === null) {
        if (node.lcIdx <= 32767 ) {
           alert("Error at node " + node.index + ".  No left child; expected a left-child index " + node.lcIdx + ".");
        }
      } else {
        if (node.lcIdx === node.leftChild.index){
        } else {
          alert("Error at node " + node.index + ".  Expected left child index " + node.lcIdx + ", instead found " + node.leftChild.index);
        }
      }
    }
    function ckRight(node) {
      if (node.rightChild === null) {
        if (node.rcIdx <= 32767 ) {
           alert("Error at node " + node.index + ".  No right child; expected a right-child index " + node.rcIdx + ".");
        }
      } else {
        if (node.rcIdx === node.rightChild.index){
        } else {
          alert("Error at node " + node.index + ".  Expected right child index " + node.rcIdx + ", instead found " + node.rightChild.index);
        }
      }
    }
  },
    
  findNearestNode: function() {
  /*
    Descend left/depth first.  Don't record "min dist" until reaching first leaf.
    Subsequently, at each vertex, compare distance-to-xy.  Then determine whether
    descending could possibly find a smaller distance.  NOTE the first split (ie,
    the split at the root) is on Lat, by construction of the serialized file.
  */
    const huge = 1E30;
    var splitOnLat = false;   // Reverse on entry or departure from findNearest.
    var oNode;
    var x = document.getElementById("x_pixel").value;
    var y = document.getElementById("y_pixel").value;
    mycode.appendP("tree","Beginning at node " + mycode.root.index + ", seeking node nearest " + x + ", " + y);
    oNode = {x:x, y:y, minDist:[], nodes:[]};
    oNode.minDist[0] = huge;
    findNearest(oNode, mycode.root);
    for (var i = 0; i < oNode.minDist.length; i++) {
      oNode.minDist[i] = Math.sqrt(oNode.minDist[i]);
      }
    mycode.appendP("searchResult", "Node nearest (" + x + "," + y + ") is " + oNode.nodes[0].toString() + ", distance " + oNode.minDist[0].toPrecision(2));
    return;
    
    function findNearest(oNode, vertex){
    // Traverse to the first left-terminal node, which will define the initial minimum distance.
    // Then retrace, looking to see if the branch could possibly contain a closer node.
      var d;
      var s;
      if (oNode === null) return;
//    Is this node the closest so far?
      s = splitOnLat? " lat:" + vertex.lat + ", LON:" + vertex.lon :
                      " LAT:" + vertex.lat + ", lon:" + vertex.lon;
      mycode.appendP("tree", "inspecting " + vertex.index + s);
      if (oNode.minDist[0] >= huge) {
//      We've not yet reached a terminal node, so not set minDist.  If this is it, initialize minDist:
        if (vertex.leftChild === null) {
        oNode.nodes[0] = vertex;
        oNode.minDist[0] = vertex.distSq(oNode.x, oNode.y);
        mycode.appendP("tree", "Set initial minDist to " + oNode.minDist[0]);
        }
      } else {
//        We HAVE reached a terminal node; we're on  the way back up.  Check this node agains minDist:
          d = vertex.distSq(oNode.x, oNode.y);
          if (d < oNode.minDist[0]) {
            oNode.nodes[0] = vertex;
            oNode.minDist[0] = d;
            mycode.appendP("tree", "Set new minDist, " + oNode.minDist[0] + " to " + oNode.nodes[0].index);
        }
      }
//    What vertex to we inspect next?  Go left first, so we get to the leftmost bottom:
      splitOnLat = !splitOnLat; //first-time-through (considering root), should split-on-lat.

      if (vertex.leftChild !== null) {
//      There is a left-branch we can consider:
        if ( (splitOnLat && (d = Math.abs(vertex.leftChild.lat - oNode.y))*d < oNode.minDist[0]) ||
            (!splitOnLat && (d = Math.abs(vertex.leftChild.lon - oNode.x))*d < oNode.minDist[0])) {
          mycode.appendP("tree","   descending to left branch...");
          findNearest(oNode, vertex.leftChild);
//        Toggle split on coming back up:          
          splitOnLat = !splitOnLat;
        } else {
          mycode.appendP("tree","ignoring left-branch of " + vertex.index);
          }
      }
      
      if (vertex.rightChild !== null) {
//      There is a left-branch we can consider:
        if ( (splitOnLat && (d = Math.abs(vertex.rightChild.lat - oNode.y))*d < oNode.minDist[0]) ||
            (!splitOnLat && (d = Math.abs(vertex.rightChild.lon - oNode.x))*d < oNode.minDist[0])) {
          mycode.appendP("tree","    descending to right branch");
          findNearest(oNode, vertex.rightChild);
          splitOnLat = !splitOnLat;
        } else {
          mycode.appendP("tree","ignoring right-branch of " + vertex.index)
          }
      }
//    Do I also need !splitOnLat here???  I think it is already done.  
      return;
    }
   }
};
//====================================    
    
var MYSTUFF = {wayPtBlockClick:false, boatIcon:null, boatImg:"greendot.gif", waypointMark:"reddot.gif", coursePointMark:"coursePoint.gif", imgDir:"charts", bool:true};

MYSTUFF.chartDatum = [];

MYSTUFF.setup = function(){
  mycode.parseStdPoints();
  $(".draggable").draggable();
  $('.resizeable').resizable();
  };
  
MYSTUFF.initialize = function() {
 //    console.log("run initialize");
 /*************************************************************
  * Set up the calendar the user will use to enter animation
  * start date & time, and duration.  The argument of calendar.set()
  * is the id of the text box in which the user clicks to show 
  * the calendar, and into which the calendar puts the selected date.
  * The remainder (dd,mm, yyyy...) simply initializes the date
  * to "today".
  * Also, define an object to "remember" state of animation.
  **************************************************************/
    var gAngle;
    var gContext;
    var gCanvas;
    var gMagnify = 1;
    var gDeMagnify = +0.4;
    calendar.set("animationStartDate"); //http://www.openjs.com/scripts/ui/calendar/
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth();
    var yyyy = today.getFullYear();
    var hr = today.getUTCHours();
    var min = today.getUTCMinutes();
    document.getElementById("animationStartDate").value = yyyy + "-" + mm + "-"+dd;
    document.getElementById("animationStartHours").value = hr;
    document.getElementById("animationStartMinutes").value = min;
//  Animation state.  date is (or will be) {year month day hr min}
    MYSTUFF.animation = {tides:null, tideNow:-1, patternNow:-1, date:{year:-1}};
//  Patterns (Arrows and a "Plus Sign") to be drawn by drawVector
    MYSTUFF.cVector = [];
    var length, lengthBase;
    var speed;
    speed = 0;
    var a = 4; // arrowhead half-width
    var s = 0; // shaft half-width
    MYSTUFF.cVector[speed] = {desc:"still water", 
                              x:[ -3, 3, 0,  0,  0, 0,-3, 0, 0],      /* PLUS */
                              y:[  0, 0, 0, -3, +3, 0, 0, 0, 3]};
    speed = 1;
    lengthBase = 7;
    
    length = speed + lengthBase;
    MYSTUFF.cVector[speed] = {desc:"< 0.25kt", 
                              x:[-0, -0, -a, 0, +a, 0, 0],            /* No feathers */
                              y:[0, -length, -length, -(length + 5), -length, -length, 0]};

    speed = 2; /* one feather (0 is a plus, 1 is no feathers) */
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"0.25 - 0.50kt", 
                              x:[0,   0, -4,  0,  0,       -a,       0,            +a,       0,      0],
                              y:[0,  -2,  0, -2,  -length, -length, -(length + 5), -length, -length, 0]};

    speed = 3; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"0.50 - 0.75kt", 
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s,      -a,       0,            +a,       s,       s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -length, -length,  -(length + 5), -length, -length, 0]};

    speed = 4; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"0.75 - 1.00kt", 
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,       -s,      -a,       0,            +a,       s,       s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,        -length, -length,  -(length + 5), -length, -length, 0]};

    speed = 5; /* 4 feathers, all on the same side */
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"1.00 - 1.25kt", 
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,       s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length, 0]};

    speed = 6; /* 5 feathers (4 on one side, 1 on other)*/
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"1.25 - 1.50kt", 
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,         s, 5,  s,  s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length,  -2, 0, -2,  0]};

    speed = 7; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"1.50 - 2.00kt",  
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,        s,   5,  s,  s, 5, s,  s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length, -4,  -2, -4, -2, 0, -2,  0]};

    speed = 8; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"2.00 - 2.50kt", 
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,         s,   5,  s,   s,  5,  s,   s, 5, s, s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length,  -6,  -4, -6,  -4, -2, -4,  -2, 0, -2,  0]};
    speed = 9; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"> 2.50kt", 
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,        s, 5, s,     s,   5,  s,   s,  5,  s,   s, 5, s, s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length, -8, -6, -8,  -6,  -4, -6,  -4, -2, -4,  -2, 0, -2,  0]};
    
    MYSTUFF.showKey = function(){
      //Put ULC at x = 255, y = 170
      //4/19/2018 modified to accomodate change in "drawVector", which was (position, speedHdg, context), now (vertex, chart, context).
      var ulc={x:255, y:170};
      var spdHdg = []; //{speed:0, hdg:0};
      var canvas = document.getElementById("myCanvas");
      var ctx = canvas.getContext("2d");
      var vertex;
      
      ctx.font = "20px sans-serif"
      ctx.fillText('Vector key:', ulc.x, ulc.y);
      for (spdHdg[0] = 0; spdHdg[0] < 10; spdHdg[0]++){
        ulc.y = ulc.y + 25;
        ctx.fillStyle = "black";
        ctx.fillText(MYSTUFF.cVector[spdHdg.speed].desc, ulc.x+5, ulc.y);
        currents[0] = spdHdg;
        vertex = {lat:ulc.y-6, lon:ulc.x+125, currents:spdHdg};
        MYSTUFF.drawVector(vertex, 0, ctx);
        }
    };
/*
 *  Show non-modal dialog.  See non-modal-dialog.html
 */ 
    MYSTUFF.showInfoDlg = function(){
    var closeDlg = "Close Dialog";
    var btnText = $("#btnShowInDialog").val();
    if (btnText === closeDlg) {
      $("#dialog").dialog("close");
    } else {
//    display data (<p> elements) are updated whether dialog is visible or not      
      $("#dialog").dialog({beforeClose:function(event, ui){
        $("#btnShowInDialog").val("Show Dialog");}});
      $("#dialog").dialog({title:"Time, Chart # & Tide"});
      $("#btnShowInDialog").val(closeDlg);
      }
    }
    
    MYSTUFF.updateDialog = function(patternTime, charts, tide){
   // ID's are defined in the div containing the dialog.
      $("#dlgTime").text(patternTime);
      $("#dlgChart").text(charts);
      $("#dlgTide").text(tide);
    }
 /*************************************************************
 *  Get chart scale data from (my) kap file header.
 *  My kap file header has the same name as the image file, 
 *  with an extension ".header".
 **************************************************************/
    MYSTUFF.feetPerDegLat = 6076.12*60;
    MYSTUFF.feetPerNm = 6076.12;
    
    MYSTUFF.chartName = $("#chart").prop("src");
    if (MYSTUFF.chartName.indexOf("localhost") > -1) {
//  chartname returned by prop('src') is http://localhost..., and that does not work when passed to get_chart_scale.php    
        MYSTUFF.temp = MYSTUFF.chartName.indexOf("gulfcurrents");
        MYSTUFF.chartName = MYSTUFF.chartName.substring(MYSTUFF.temp + 13)
    } else {
//  I have no idea if some similar futzing around is necessary on the 'real' site    
    }
     MYSTUFF.metaDataFile = MYSTUFF.chartRoot + ".header";
     MYSTUFF.metaDataFile = "charts/18400_lg.header";
    
//This is mostly so I don't forget waypoint properties.  Perhaps functions can be added to wp at some point.    
    MYSTUFF.wp = {index:0, lat:0, lon:0, cs:0, cd:0, vs:0, vd:0, hdg:0, t:0};//latitude, longitude, current speed, ~ direction, vessel speed, vessel direction, vessle heading, time of arrival at this point}
    // if (typeof Object.create !== "function" ) {
        // Object.create = function(obj) {
            // var F = function() {};
            // F.prototpye = obj;
            // return new F();
            // };
        // } else {
            // //new improved js already here
        // }
    MYSTUFF.UserException = function(message) {
    //Error object constructor
       this.message = message;
       this.name = "UserException";   
       };
/***************************************************************************
* CURRENT DISPLAY ROUTINES AND VARIABLES.                                  *
*   showCurrents is intitialized to off.  A button on the page toggles it. *
*   Mark locations of standard current points.                             *
*   For the purpose, this intializes mystuff.stdPoints:                 *
*      MYSTUFF.stdPoints[i][0] contains the Y-coordinate of point i,  *
*       ~              [i][1] contains the X-coordinate of point i.   *
  ***********************************************************************/
    MYSTUFF.showingCurrents = false;
    
    MYSTUFF.getStartTimeObj = function() {
      var oDate = MYSTUFF.isValidYyyyMmDd(document.getElementById("animationStartDate").value);
      var t = document.getElementById("animationStartHours").value + ":" + document.getElementById("animationStartMinutes").value
      var oTime = MYSTUFF.isValidTime(t);
      if (!oDate && !oTime){
        alert("Start Date and Start Time are not valid.");
        return false;
      } else if (!oDate) {
        alert("Start Date is not valid");
        return false;
      } else if (!oTime) {
        alert("Start Time is not valid");
        return false;
      }
   // Date and time are valid.  Only 2018 is supported at this moment:
      if (oDate.year != 2018){
        alert("Data are currently available only for 2018.");
        return false;
      } 
      oDate.hr = oTime.hr;
      oDate.min = oTime.min;
      return oDate; //valid argument for Date(xxx)      
    }

 // Validates that the input string is a valid date formatted as "mm/dd/yyyy"
    MYSTUFF.isValidYyyyMmDd = function(dateString) {
      var parts = dateString.split("-");
      if (parts.length != 3) {return false;}
      var year = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10);
      var day = parseInt(parts[2], 10);
      // Check the ranges of month and year
      if(year < 1000 || year > 3000 || month == 0 || month > 12) return false;
      var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
      if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) monthLength[1] = 29;
      return day > 0 && day <= monthLength[month - 1] ? {"month":month, "day":day, "year":year} : false;
    }  
    MYSTUFF.isValidDate = function(dateString){
/*
 *    stackoverflow.com/questions/6177975/how-to-validate-date-with-format-mm-dd-yyyy-in-javascript
 *    Slightly modified to return an object (which evaluates to true) if the date string is valid.
 */
      // First check for the pattern
      if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString))
          return false;

      // Parse the date parts to integers
      var parts = dateString.split("/");
      var day = parseInt(parts[1], 10);
      var month = parseInt(parts[0], 10);
      var year = parseInt(parts[2], 10);

      // Check the ranges of month and year
      if(year < 1000 || year > 3000 || month == 0 || month > 12)
          return false;

      var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

      // Adjust for leap years
      if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
          monthLength[1] = 29;

      // Check the range of the day
      return day > 0 && day <= monthLength[month - 1] ? {"month":month, "day":day, "year":year} : false;
    };
    
    MYSTUFF.isValidTime = function(timeString){
/*
 *  Return timeString or false.  valid timeString is hh:mm (no seconds, hh 0...23, mm 00:59)
 *  Regex from stackoverflow.com/questions/5563028/how-to-validate-with-javascript-an-input-text-with-hours-and-minutes
 */      
    //  if (!(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(timeString))) {
    //    return false;
    //  } else {
        var parts = timeString.split(":");
        return {hr:parts[0], min:parts[1]};
        //return timeString;      
     // }
    }
    MYSTUFF.getCycleTime = function(){
      var hrs = document.getElementById("animationDurationHours").value;
      if (!$.isNumeric(hrs)){
        alert("Animation duration must be numeric; '"  + hrs + "' is not numeric.");
        return false;
      }
      if (hrs < 1 || hrs > 999) {
        alert("Animation must be at least 1 hour, and no more that 72 hours. " + hrs + " is not valid.");
        return false;
      }
      return hrs;
    };
    
    MYSTUFF.stopStart = function(){
  /*
   *  When the FreezeContinue button is clicked, and the title ("value") is
   *  "Continue", this function invokes showNextCurrent and changes the 
   *  title to "Freeze".
   *  
   *  If the title is "Freeze", this does nothing.  showNextCurrent should
   *  also inspect the title.  If it is "Freeze", showNextCurrent will 
   *  save the state, change the title, and exit without rescheduling 
   *  itself.
   *
   */
      var el = document.getElementById("btnFreezeContinue");
      if (el.innerHTML === "Freeze") {
        if (MYSTUFF.animation.sequence === null){
          alert("Internal error: tried to restart animation, but there are no Tides.");
          return;
        }
        el.innerHTML = "Continue";
      } else {
        el.innerHTML = "Freeze";  // showNextCurrent must see this button value, save state, and not reschedule itself.
        MYSTUFF.showNextCurrent(MYSTUFF.animation.tides, MYSTUFF.animation.tideNow, MYSTUFF.animation.patternNow);
      }
    };
    
    MYSTUFF.toggleDrawCurrents = function(){
//    Button handler: start/stop drawing current vectors (showingCurrents is tested by showNextCurrent)
      MYSTUFF.showingCurrents = ! MYSTUFF.showingCurrents;
      if (typeof MYSTUFF.currents === 'undefined') {
          MYSTUFF.currents = GENCURRENTDB.getCurrent();
      }
      var button = document.getElementById("btnShowCurrentSequence");
      var startTimeObj = MYSTUFF.getStartTimeObj();        // Gets & vets time user has entered in text boxes, and announces any error.
      if (!startTimeObj) {return;}                         // Get has already issued any error messages, if necessary.
      var cycleTime = MYSTUFF.getCycleTime();              // Returns a number 1...72, or false
      console.log("cycleTime:" + cycleTime);
      if (!cycleTime) {return;}
      var oldDate = MYSTUFF.animation.date;                // If we've already gotten data, the date sb here.
      if (oldDate.year === startTimeObj.year &&            // {year month day hr min}
          oldDate.month === startTimeObj.month &&
          oldDate.day === startTimeObj.day &&
          oldDate.hr === startTimeObj.hr &&
          oldDate.min === startTimeObj.min &&
          oldDate.cycleTime === cycleTime &&
          MYSTUFF.animation.tideNow !== -1)
          {
       //   Start time has not changed, and we have the sequence over the correct time.
       //   Just do what gotSequence does:
            MYSTUFF.showNextCurrent(MYSTUFF.animation.tides, 0, sequence[0].firstChart);
          }
      if (MYSTUFF.showingCurrents) {     
        if (typeof MYSTUFF.stdPoints === 'undefined') {
          MYSTUFF.stdPoints = GETCURRENTDB.getstdcurrentpoints();
        } else {
        }
//      start updating current vectors.
        button.value = "freeze currents";
//      I THINK Date creates an object that "knows" it represents time in a particular time zone :-(
//      When a month, day, year, etc., is extracted by getDate), getDay(), etc, the "local" offset is added.
//      If you extract with getUTCDate(), getUTCDay(), etc, no offset is added.
        console.log("Date: " + startTimeObj.month + "/" + startTimeObj.day + "/" + startTimeObj.year +
                    " at " + startTimeObj.hr + ":" + startTimeObj.min);
        
        MYSTUFF.getSequence(startTimeObj, cycleTime);
        return;
        
        var sequence = MYSTUFF.defineCurrentSequence();
        
        if (!sequence) {
          button.value = "Play current";
          MYSTUFF.showingCurrents = false;
        } else {
//        sequence[0] describes the first sequence-of-charts          
          var s = sequence[0];
          console.log("Tide duration: " + s.tideDurationMin + " minutes");
          MYSTUFF.showNextCurrent(s.secPerHr, sequence, 0, s.chart, s.lastChart, s.tideDesc, s.tideDurationMin, s.startDatePST, s.tideDurationMin/(s.lastChart - s.chart + 1));
          }
        } else {
//        Stop updating current vectors; leave current vectors where they are.
          button.value = "Play current";
        }
     };
    
      MYSTUFF.showNextCurrent = function(sequence, nSeq, nChart){
/*
 *    Draw current vectors at chart nChart in sequence[nSeq].
 *    Then point to next nChart (and perhaps sequence[nSeq+1]).
 *    First called from gotSequence (Ajax success handler), subsequently called from itself until MYSTUFF.showingCurrents is set.
 */
      var canvas;
      var zindex;
      if (MYSTUFF.bool){
        canvas = document.getElementById("myCanvas");
      } else {
        canvas = document.getElementById("trackCanvas");
      }
      zindex = canvas.style.zIndex;
      var ctx = canvas.getContext("2d");
      var secPerHr = sequence[0].secPerHr;                                      //Only element zero has this property; don't want it more than once.
      var seq = sequence[nSeq];                                                 //Current page-sequence, e.g., Large Rising
      var tideDuration = seq.tideDurationMin;                                   //Duration of this sequence
      var stepDurationMin = tideDuration/(seq.lastChart - seq.firstChart + 1);  //Duration of any one pattern in this sequence
      var showFor = (stepDurationMin/60)*secPerHr*1000;                         //Delay (timeout) before invoking this routine again (ms)
      var timeOffset = (nChart - seq.firstChart)*stepDurationMin*60000;         //Offset at start of this current pattern
      var timeNow = new Date(seq.startDatePST.getTime() + timeOffset);          //Time-of-day at start of this pattern
      var vector;
      var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      
      if (document.getElementById("btnFreezeContinue").innerHTML === "Continue") {
        MYSTUFF.animation = {tides:sequence, tideNow:nSeq, patternNow:nChart};
        return;
      }
      ctx.clearRect(450,400, canvas.width, canvas.height);     //Clear Canvas, except for Key, whose LRC is about (450, 400) 
      ctx.setTransform(1, 0, 0, 1, 0, 0);
/*
 *    Display chart #sequence[nItem].chart in span element, 
 *    update dialog to indicate 
 *      - what chart we're showing,
 *      - the # of the final chart in the sequence, 
 *      - The sort of tide the sequence represents (eg, Lg Falling)
 *      - the date & time that the depicted pattern starts to form.
 */ 
      var spanEl = document.getElementById('showingChart');
      var simTime = timeNow.getUTCHours() + ":" + timeNow.getUTCMinutes() + " on "
          + dayNames[timeNow.getUTCDay()] + " " + monthNames[timeNow.getUTCMonth()] + " " + timeNow.getUTCDate() 
          + ", "  + timeNow.getUTCFullYear();
      var charts = "chart "  + nChart + " in " + seq.firstChart + "-" + seq.lastChart;
      if (spanEl){
        spanEl.textContent =ctx.canvas.id + " Showing chart " + nChart + " of " + seq.tideDesc + " series "
          + seq.firstChart + "-" + seq.lastChart + " over " + tideDuration 
          + " munutes (" + tideDuration/50 + " hours), so each step is "  
          + Math.round(stepDurationMin) + " minutes." + " This pattern begins at " 
          + simTime; 
        //+ dayNames[timeNow.getDay()] + " " + timeNow.getDate() + " " 
        //+ monthNames[timeNow.getMonth()];
      } else {
        alert("Internal error: span 'showingChart' does not exist");
      }
//    Updating the dialog assigns text content to <p> elements, whether or not the dialog is displayed
      MYSTUFF.updateDialog("Time:" + simTime, "Charts: " + charts, "Tide: " + seq.tideDesc);
//    DRAW THE CURRENT VECTORS
//    Iterate over all "standard points".  For each, get current for given chart:
      var iterator = mycode.iterateOverTree(mycode.root);
      while(iterator.hasNext()){
        vector = iterator.next();
        MYSTUFF.drawVector(vector,nChart-1, ctx);
      } 
//    Update chart number
      if (nChart < sequence[nSeq].lastChart) {
//      Show the next chart in the current tide:
        nChart = nChart + 1;
      } else {
//      Show the next tide (starting with the first chart)
        if (nSeq + 1 < sequence.length) {
          nSeq = nSeq + 1;
        } else {
          nSeq = 0;
        }
        nChart = sequence[nSeq].firstChart;
      }
 
//    Schedule this to run again after showFor milliseconds:
      setTimeout(MYSTUFF.showNextCurrent.bind(null, sequence, nSeq, nChart ),showFor);
    };  
    
    MYSTUFF.drawRedPlus = function(vertex, chart, ctx){
//  If debugging, maybe use this (which draws a large red + near Victoria) instead of drawVector.  
      var x, y, lat, lon, magnification;
      var color;
      lon = 2288;
      lat = 1874;
      color = "red";
      magnification = 5;
      ctx.strokeStyle = color;
      x = MYSTUFF.cVector[0].x;
      y = MYSTUFF.cVector[0].y;
      ctx.translate(lon, lat);  // this appears to be backwards in drawVector: lat is Y, lon is X
      ctx.moveTo(x[0],y[0]);
      ctx.lineWidth = 5;
      ctx.fillStyle = "red";
      ctx.beginPath();
      for (var i = 0; i < x.length; i++){
        ctx.lineTo(x[i]*magnification,y[i]*magnification);
      }
      ctx.stroke();//    Restore identity transform:      
      ctx.setTransform(1,0,0,1,0,0);
    };
    
    MYSTUFF.clearVectors = function(){
      var canvas = document.getElementById("myCanvas");
      if (canvas === null){alert("Intenal error: no element id 'myCanvas' found"); return;}
      var ctx = canvas.getContext("2d");
      ctx.clearRect(0,0, canvas.width, canvas.height);     //Clear Canvas, except for Key, whose LRC is about (450, 400) 
    };
    
    MYSTUFF.drawVector = function (vertex, chart, ctx){ //xyLoc, spdHdg, ctx) {
//    Draw an arrow at location xyLoc (a two-element array, I think) at spdHdg.speed, spdHdg.hdg.
//    3/6/2018 modified to draw a + if the current is zero.  I think pt#->lat, lon is in StandardPoints.txt.
//    4/18/18 modified to take args "vertex" object & chart#, rather than spdHdg & stdPoint.
      
      var color;
      var x;
      var y;
      var speed;
      var heading;
      var magnification;
      var lineWidth;
      var yada;
      var length;// = 5 + spdHdg.speed;
      var rotate;
      x = vertex.lon;
      y = vertex.lat;
      speed = vertex.currents[chart];
      heading = Math.trunc(speed/10);
      speed = speed - heading*10;
      magnification = 1;
      lineWidth = 1;
      color = "blue";
      ctx.strokeStyle = "blue";
//    Use predefined vectors 3/9/2018 
      var nVector = speed >= MYSTUFF.cVector.length? MYSTUFF.cVector.length - 1 : speed; //spdHdg.speed > 2? 2 :spdHdg.speed;
      x = MYSTUFF.cVector[nVector].x;
      y = MYSTUFF.cVector[nVector].y;
//    end 3/9/2018

//    Translate so canvas ULC is at origin of vector coordinate system. Then rotate, draw, fill, translate.
      ctx.translate(vertex.lat, vertex.lon); //was (xyLoc[1], xyLoc[0]
      ctx.rotate(heading * Math.PI / 180);
      ctx.moveTo(x[0],y[0]);
      ctx.lineWidth = lineWidth;
      ctx.fillStyle = color;
      ctx.beginPath();
      for (var i = 0; i < x.length; i++){
        ctx.lineTo(x[i]*magnification,y[i]*magnification);
      }
//    Current vectors are filled if > 0, else Stroke:      
      if (speed > 0) {
        ctx.fillStyle = color; //'rgba(84, 255,159,0.5)'; //Sea Green is 84, 255, 159;
        ctx.stroke();
        ctx.fill();
      } else {
        ctx.stroke();
      }
        
//    Restore identity transform:      
      ctx.setTransform(1,0,0,1,0,0);
    };
    
    MYSTUFF.drawLine = function(fromXy, toXy, ctx) {
      ctx.beginPath();
      ctx.moveTo(fromXy.x, fromXy.y);
      ctx.lineTo(fromXy.x, fromXy.y);
      ctx.lineTo(toXy.x, toXy.y);
      ctx.stroke();
    };
    
    MYSTUFF.showStdCurrents = function(){
      if (typeof MYSTUFF.stdPoints === 'undefined') {
        MYSTUFF.stdPoints = GETCURRENTDB.getstdcurrentpoints();
      }
     for (var i = 0; i < MYSTUFF.stdPoints.length;i++)
      {
       MYSTUFF.drawArrow(MYSTUFF.stdPoints[i]);
      }
     };
     
    MYSTUFF.gotError = function(jqXHR, textStatus, errorThrown) {
      alert("gotError: getSequence failed, status " + textStatus + ", error " + errorThrown + ", responseText:" + jqXHR.responseText);
    };
    
    MYSTUFF.getSequence = function(oDT, durationHours){
      var dataString = "mon=" + oDT.month + "&day=" + oDT.day + "&year=" + oDT.year + 
                       "&hr=" + oDT.hr + "&min=" +oDT.min + "&hours=" + durationHours;
      var url = "getTides.php";
      append_debug(" Requesting data for period starting " + dataString + ", duration "  + durationHours + " hours.");
      settings = {dataType:"json",success:MYSTUFF.gotSequence,error:MYSTUFF.gotError,data:dataString, cache:"true"};
      //"mon=1&day=2&year=2018&hr=13&min=20&hours=72"};
      jQuery.ajax(url, settings);
    }
    MYSTUFF.gotSequence = function(data, sStatus, jqXHR){
/*
 *   NOTE: javascript variables are 64 Bit!
 *         javascript time is kept to millisecond precision (from the same basis as Posix time)
 *         Posix time is kept to SECOND precision.
 *
 *   This responds to a successful asynch Ajax query made by getSequence.
 *   Earlier version of toggleDrawCurrents:
 *       sequence = MYSTUFF.defineCurrentSequence()  // get an array of page-sequence data
 *       ...
 *       showNextCurrent(s.secPerHr, sequence, first-sequence)
 *   AJAX doesn't allow us to write sequence = xxx.  Instead, the function
 *   receiving the data (ie, this function, gotSequence) must kick off the 
 *   sequence. So:  toggleDrawCurrents invokes MYSTUFF.getSequence.
 *     On success, browser invokes MYSTUFF.gotSequence(data, sStatus, jqXHR). 
 *     gotSequence invokes showNextCurrent(...), which kicks off the process.
 *   
 *   An element of data[] looks like{"posixearliestTime":1514910600,"firstChart":22,
 *   "lastChart":29,"duration":420,"description":"Lg F "}
 *   See gotStuff(...) in testGetTides.php.
 */      
      append_debug("gotSequence got an array with " + data.length + " elements.");
      var sequence = [];
      var el = document.getElementById("debugOutput");
    //  el.textContent = el.textContent +  " got data for " + data[0].posixearliestTime;
    //First element in sequence is different; it has the properties secPerHour and startDatePST.
      sequence[0] = {secPerHr:2, firstChart:data[0].firstChart, 
                     posixStartTime:data[0].posixearliestTime,  //for debug purposes...
            lastChart:data[0].lastChart, tideDesc:data[0].description,
            startDatePST:new Date(data[0].posixearliestTime*1000), tideDurationMin:data[0].duration};
      for (var n = 1; n < data.length; n++){
        sequence.push({firstChart:data[n].firstChart, lastChart:data[n].lastChart, 
                    tideDesc:data[n].description, 
                    startDatePST:new Date(data[n].posixearliestTime*1000), 
                    tideDurationMin:data[n].duration});
        }
//Debug: what is getting passed?
      console.log("There are " + sequence.length + " tides:");
      for(var n = 0; n < sequence.length; n++) {
        console.log(n + ": " + sequence[n].tideDesc + " charts " + sequence[n].firstChart + "-" + sequence[n].lastChart);
      }
      console.log("First chart: " + data[0].firstChart + ", duration " + data[0].duration);
      
      document.getElementById("btnFreezeContinue").disabled = false;
      document.getElementById("btnFreezeContinue").innerHTML = "Freeze";
      MYSTUFF.showNextCurrent(sequence, 0, sequence[0].firstChart);
      }
    
     MYSTUFF.drawArrow = function(yx){
/**********************************************************
    draw arrow centered at yx[0], yx[1].
***********************************************************/    
      var x = [-4, 1, 1, 4,  1,  1, -4, -4]; //
      var y = [ 2, 2, 5, 0, -5, -2, -2,  2];
      var a, b;
      var magnification;
      var cRadius = 2;
      var cStartAngle = 0;
      var cEndAngle = 2*Math.PI;
      var cDirection = 0; //cw or ccw
      
      magnification = 1;
      canvas = document.getElementById("myCanvas");
      ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(yx[1], yx[0], cRadius, cStartAngle, cEndAngle, cDirection);
      ctx.fillStyle = 'blue';
      ctx.fill();
      ctx.stroke();
      return;
      a = x[0]*magnification+yx[1];
      b = y[0]*magnification+yx[0];
      
      ctx.moveTo(a, b);
      for (var i = 1; i < x.length; i++){
      a = x[i]*magnification+yx[1];
      b = y[i]*magnification+yx[0];
        ctx.lineTo(a, b);
       }
      ctx.fillStyle = 'blue';
      ctx.fill();
      }
      
/******************************************************
*
*   Get chart metadata.  File name is same as chart with extension "header".
*
*******************************************************/
    var setChartScale = function(data) {
    //Ajax populates 'data'            
        MYSTUFF.degLatPerPixel =  (data.LAT1 - data.LAT2)/( data.LAT1PX - data.LAT2PX);
        MYSTUFF.degLonPerPixel = (data.LON1 - data.LON2)/(data.LON1PX - data.LON2PX);
        MYSTUFF.feetPerDegLon = MYSTUFF.feetPerDegLat*Math.cos(data.PP*Math.PI/180.0);
        MYSTUFF.feetPerLatPixel = MYSTUFF.degLatPerPixel * MYSTUFF.feetPerDegLat;
        MYSTUFF.feetPerLonPixel = MYSTUFF.degLonPerPixel * MYSTUFF.feetPerDegLon;
        MYSTUFF.ulc_latitude = Math.max(data.LAT1,data.LAT2) - MYSTUFF.degLatPerPixel*Math.min(data.LAT1PX, data.LAT2PX);
        MYSTUFF.ulc_longitude =Math.max(data.LON1,data.LON2) - MYSTUFF.degLonPerPixel*Math.min(data.LON1PX, data.LON2PX);
        MYSTUFF.referenceLatitude = data.PP;
    };
    
     $.ajaxSetup({ cache: false });
     $.ajax({
            url:         "get_chart_scale.php",
            
            data:      {chart_file_name:MYSTUFF.metaDataFile},   //params passed to serever CLEAN OUT CODE
            dataType: "json",
            success:  setChartScale,
            error: function(jqXHR, status, error) {
                    alert("status:" + status + ", error:" + error);  //THIS SHOULD ANNOUNCE IN DASHBOARD ON CHART
                    }
            });
/*************************************************************************************
*  End of section getting metadata
**************************************************************************************/            
     MYSTUFF.radPerDeg = Math.PI/180.0;
     MYSTUFF.degPerRad = 180.0/Math.PI;
     MYSTUFF.currentServerRoot  = "getClosestPoint";
     MYSTUFF.coursePointImg = new Image();
//     console.log("set coursePointMark.src...");   
     MYSTUFF.coursePointImg.src = MYSTUFF.imgDir + "/" + MYSTUFF.coursePointMark;
     MYSTUFF.hideWaypointData = function(event) {
     // This event occurs when we mouse over a waypoint image - an img element with
     // class "wayptimg". The element should have an ID of the form "wyptN" where 
     // N is the integer id of the waypoint.  
     // 
     // Near the waypoint image there should be a <div> with the unique id "wayptNdata".
     // That div should contain information about the waypoint such as expected time 
     // at that waypoint, heading of the boat, direction of travel (which is "heading
     // of the boat" plus the current), latitude, longitude, current velocity and so on.
         var dataDivId = "#" + event.target.id + "data";
         $(dataDivId ).hide( "slow" );
     };
    
    MYSTUFF.waypointData = [];
    MYSTUFF.showWaypointData = function(event) {
        var dataDivId = "#" + event.target.id  + "data";
        $(dataDivId).show( "slow" );
    };
 
    MYSTUFF.openWaypointInfo = function(event) {
//  This handler for a doubleclick event on a waypoint gif is attached in createWaypoint. 
//  It SETS values in a table (#markData).  It is complemented by
//  closeWaypointInfo, which handles a click on the CLOSE icont
      var id = event.data.ID;
      MYSTUFF.currentWaypoint = id; //closeWaypointInfo needs this index
      $("#mk_ID").val(MYSTUFF.waypointData[id].id);
      $("#mk_Name").val(MYSTUFF.waypointData[id].name);
      $("#mk_lat").val(MYSTUFF.waypointData[id].lat);
      $("#mk_long").val(MYSTUFF.waypointData[id].lon);
      $("#mk_eta").val(MYSTUFF.waypointData[id].etaThis);
      $("#mk_etanext").val(MYSTUFF.waypointData[id].etaNext);
      $("#mk_distnext").val(MYSTUFF.waypointData[id].distanceToNext);
      $("#mk_bearnext").val(MYSTUFF.waypointData[id].bearingToNextDeg);
      $("#mk_hdgnext").val(MYSTUFF.waypointData[id].headingToNext);
      $("#mk_curhdg").val(MYSTUFF.waypointData[id].currentHdg);
      $("#mk_curvel").val(MYSTUFF.waypointData[id].currentSpeed);
      $("#markData").show();
    };
   
    MYSTUFF.closeWaypointInfo = function() {
    // event handler - click on markDataCloseGif
//This event handler sets a js array to values in the table
//It complements openWaypointInfo.    
    var id = MYSTUFF.currentWaypoint;
    MYSTUFF.waypointData[id].name = $("#mk_Name").val();
    $("#markData").hide();
    };
    
    MYSTUFF.headingToCart = function(heading) {
    //Convert heading in degrees to cartesian coordinates in radians
    //I leave txyToLatLonghe 90 & 360 in explicitly because its easier to understand.
        return MYSTUFF.radPerDeg*(((90 - heading) + 360) % 360);
    };
    
    MYSTUFF.xyToLatLong = function (xy) {
    //convert chart xy to lat/long
        return {lat: MYSTUFF.ulc_latitude + MYSTUFF.degLatPerPixel * xy.y, 
                     lon:MYSTUFF.ulc_longitude + MYSTUFF.degLonPerPixel* xy.x};
    }; 
    
    MYSTUFF.dPixelsToDNm = function(xy) {
    // Convert dx, dy in pixels to dx,dy in nautical miles.
    // 60.113nm per degree of longitude at the equator, 60.012nm per degree of latitude.
    // See astronavigationdemystified.com/the-relationships-between-longitude-and-latitude-and-the-nautical-mile
     //cos(49.37108824) = 0.651157267
     // 0.651157267 * .001427436 = 0.000929485
        return { dy:0.000939501*xy.dy*60.012, dx:0.000929485*xy.dx*60.113};
    }
    
    MYSTUFF.isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    
    MYSTUFF.getDate = function(dateId, timeId) {
    /*********************************************************
  * Returns javascript date object.  Note value is ms from 1/1/70.  It is 1000* posix time.
  *
  * Inputs dateId & timeId are strings identifying the input text IDs.
  * The date is expected to be in the form mm/dd/yy (21st century assumed).
  * The time is expected to be in the form hh:mm.
  * Date and time are not consistent, FALSE is returned.  Otherwise a Date object is returned.
  * 
  **********************************************************/
  
    var localOffset;
//Get & Parse date mm/dd/yy  
    var ds = $("#" + dateId).val();
    var comp = ds.split('/');
    var m = parseInt(comp[0], 10);
    var d = parseInt(comp[1], 10);
    var y = parseInt(comp[2], 10) ; //century added
    if (y < 100 && y >= 0) {
        y = y + 2000;
        } else {
        throw new MYSTUFF.UserException("Year should be 0 - 99, not "  + y + ".")
        }
    var date = new Date(y,m-1,d);
    if (!(date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d)) {
        return false;    
    }
//Get and parse start time hh:mm    
    var ts = $("#" + timeId).val();
    var comp = ts.split(':')
    var hh = parseInt(comp[0], 10);
    var mm = parseInt(comp[1], 10);
    if  (!( hh>=0 && hh < 24 && mm >=0 && mm <60)) {
        return false;
    }
//Get timezone as UTC offset.  Keep the value so we know the basis even if the user changes the select later.  (Any output must indicate this internal value)
// Some of the properties & methods of the js Date object are: getTime() (ms since 1/1/70), 
// Date.getTimezoneOffset() returns offset in minutes.
    MYSTUFF.utc_offset = $("#timezone").val()*3600000;
    date = new  Date(y, m-1, d, hh, mm);                   //Date in timezone in which browser operates
    localOffset = date.getTimezoneOffset()*60000;         //Timezone offset (ms) for local in which browser operates
    return new  Date(date.getTime() +(MYSTUFF.utc_offset - localOffset));
    };
    
    MYSTUFF.getNumber = function(id) {
        var x = $("#" + id).val();
        return {val:x, status:MYSTUFF.isNumber(x)};
    }
    MYSTUFF.eventXyToChartXy = function() {
    // Convert event xy (Pagex, PageY) to chart xy.  Closure around chartLoc avoids recalculation of chart's Pagexy.
    // Modify 2/19/14 to add c.scrollLeft, c.scrollTop to position
        return function(event) {
        var c = $("#chartScroll");  //chartScroll div is INSIDE chartResz div
        var chartLoc = $("#chartResz").position(); //was #chart, then chartScroll
        return {x:(event.pageX - chartLoc.left + c.scrollLeft()),y:(event.pageY - chartLoc.top + c.scrollTop())};
            };
    }();
/**  getCurrentPages makes an asynchronous request for the Current Atlas page numbers corresponding to a particular time
 * 
 * @param {type} nPt
 * @param {type} coarseData. Array of simple objects, 
 * @param {function(pages, data)} invoked on success
 * @param {type} onFail
 * @returns {undefined} 
 */    
     MYSTUFF.getCurrentPages = function (nPt, coarseData, onSuccess, onFail) {
/************************************************************************************************************
  Asynchronous Ajax request server for the Current Atlas page appropriate to the specified time (POSIX UTC)
  Pages come in sequences, the first in a sequence being the page appropriate at the hour of high/low tide.
  Normally returns: requested page # data.req_page,  position of this page in the sequence data.req_page_seq,
  count of pages in this sequence data.page_count, and page number of first in sequence, data.first_page and
  data.status.  If data.status = 1, the data is good; otherwise, it is bad, see data.text.
*************************************************************************************************************/
        $.ajax({
            url:         "current_atlas_page.php",
            data:      {time_utc:coarseData[nPt].t},   //params passed to server
            dataType:"json",
            success:  function (pages) {                                                                                                   //Ajax populates 'data'
//        Handling data.status, including data.status < 1, is up to onSuccess:
                        onSuccess(pages, coarseData);
                 },
            error: function(jqXHR, status, error) {
//        This deals with HTTP request problems, not computational problems in current_atlas_page.php.            
                    onFail( status, error);
                    }
            })
    }; // end definition of getCurrentPages
 /**
  * Ajax function.  On success invokes onSuccess(chartDatum[last_point]).
  * @param {type} pointId
  * @param {type} onSuccess
  * @param {type} onFail
  * @returns {undefined}
  * NOTE this is used for client-side course calculation.  Currently only server-side calculates course.
  */   
    MYSTUFF.getCurrentData = function (pointId, onSuccess, onFail) {
//  Asynchronous Ajax request server for current data.  nWayPt is zero until request is complete
        //MYSTUFF.chartDatum[pointId.index] = {};
        MYSTUFF.chartDatum[pointId.index].point = pointId;  //index, x, y, region, page, latitude:lat, longitude:lon;
        MYSTUFF.chartDatum[pointId.index].status = 1;
        $.ajax({
            url:         MYSTUFF.currentServerRoot + pointId.page + ".php",
            data:      {region:pointId.region, page:pointId.page, latitude:pointId.latitude, longitude:pointId.longitude},   //params passed to server
            success:  function (data) {                                                                                                   //Ajax populates 'data'
//        set some parameters and invoke the success function            
                    MYSTUFF.chartDatum[pointId.index].status = 2;
                    MYSTUFF.chartDatum[pointId.index].data = data;
                    onSuccess(MYSTUFF.chartDatum[pointId.index]);
                 },
            error: function(jqXHR, status, error) {
                    onFail(pointId, status, error);
                    }
            })
    };
/**
 * 
 * @param {type} index
 * @param {type} queryData
 * @param {type} onSuccess
 * @param {type} onFail
 * @returns {undefined}
 */
    MYSTUFF.getTrack = function(index, queryData, onSuccess, onFail) {
/** 
 * getTrack invokes track.php to get course information from point index-1 to point index.
 */
    // This is used in place of getCurrentData when the course calculation is handed off to PHP.
        var json;// what kind of t is this? "tStart":"4014-03-05T16:00:00.000Z"
        json = {lat1:queryData[index-1].lat, lon1:queryData[index-1].lon, tStart:queryData[index-1].t, lat2:queryData[index].lat, lon2:queryData[index].lon,referenceLatutude:MYSTFF.referenceLatitude};
    $.ajax({
        url:"track.php",
        dataType:"json",
        data:json,
        success: function(data) {
//    "data" is the json object returned by track.php.
//    It is an instance of the object type contained in queryData.
            queryData[index] = data;
            onSuccess(queryData);
            },
        error: function(jqXHR, status, error) {
            onFail(queryData, status, error);
            }
        })
    };
    
    MYSTUFF.getImageSize = function() {
    var img = new Image();
    var paths = {};
    return function(path) {
    /*******************************************************************
    *   Purpose:
    *   Return the height & width of an image in pixels.  After first use
    *   for a particular path, the image is not re-accessed.  The (truncated)
    *   half-height and half-width can be used to convert between upper-left-corner
    *   and center-of-image.
    *   See stackoverflow.com/questions/623172/how-to-get-image-size-height-width-using-javascript
    *   This is closed over 'img' and 'paths'.  Note img is reused.
    ********************************************************************/
        if (paths.hasOwnProperty(path) !== true) {
            paths[path] = {};           // value of property "path" is an object
            img.src = path;               // Next, object's property "size" is an object (heights & widths)
            paths[path].size = {height:img.height, width:img.width, halfHt:Math.floor(img.height/2), halfWd:Math.floor(img.width/2)};
       }
       return paths[path].size;
   }
}();

    MYSTUFF.createWaypoint = function(position) {
/*****************************************************
    Create a waypoint (image) at position and connect waypoints.
    Also: Maintain local static variables in this.data
          Enable/Disable 'Start Boat' button as appropriate.
          Attach function to move boat to 'Start Boat' button.
    getImageSize should not be used more than once; it requests a file from the server.
    Simplified this thing.  Look in mystuff.js for the original.
*******************************************************/
 /*
    Leave off with "waypoints" in two places: here, in createWaypoint.data; and in MYSTUFF.waypointData = [].
    MYSTUFF.waypointData is set
      - here (partly), and hideWaypointData, line 1057.
    It is used in 18 places: 
       - 11 in openWaypointInfo (lines 1069ff), 1 in closeWaypointInfo (line 1088), 1 in my drag: handler (line 1375),
         1 in my stop: handler (1381), 3 times in connectWaypoints.
    I need to modify the hanlders so they're all in the same closure.

var imgSize = MYSTUFF.getImageSize(imgPath);
var imgTop =   position.y - imgSize.halfHt + "px";
var imgLeft =  position.x - imgSize.halfWd + "px";
 */
    var imgPath = MYSTUFF.imgDir + "/" + MYSTUFF.waypointMark;
    var boatData;   //initialized in btnStartBoat click handler; stores position data.
    var btnStartBoat;
    var d;
    if (typeof MYSTUFF.createWaypoint.data === 'undefined') {
      MYSTUFF.createWaypoint.data = {N:0, height:1, width:1, halfHt:1, halfWd:1, position:position, waypoints:[]};
    }
    d = MYSTUFF.createWaypoint.data;
    if (d.N === 1) {position.x = 2800; position.y=1700;}//debug
    
    var top = position.y - d.halfHt;
    var left = position.x - d.halfWd;
    var wayptId = "waypt" + d.N;
    var oImgCss  = {"z-index":3, "position":"absolute", "left":left + "px", "top":top + "px", };
    var oImgAttr = {id:wayptId, "class":"wayptMarker","src": imgPath,"data-x":position.x, "data-y":position.y, "title":"Way Pt " + d.N}
    d.waypoints[d.N] = {position:position, lat:position.lat, lon:position.lon};
    $("#chartPosRef").append($('<img>').css(oImgCss).attr(oImgAttr).draggable(MYSTUFF.dragHandlers()));

    if (d.N === 0) {position.x = 2600; position.y=1900;}//debug
    
    if(d.N === 0) {    
      d.height = $('#waypt0').height();
      d.width = $('#waypt0').width();
      d.halfHt = Math.floor(d.height/2 + 0.5);
      d.halfWd = Math.floor(d.width/2 + 0.5);
      top = position.y - d.halfHt;
      left = position.x - d.halfWd;
      $('#waypt0').css('top', top + "px").css('left', left + "px");
    }
    MYSTUFF.waypointData[d.N] = {xyLoc:position}; //, lat:latlong.lat, lon:latlong.lon};(don't think I need to drag lat/lon around - and it would need to be calculated here.
    MYSTUFF.connectWaypoints();
 
    btnStartBoat = document.getElementById("btnStartBoat");   
/*  If waypts >= 2, & a 'start boat' button, & the button is disabled, then:
      - enable & relabel the button "start boat"
      - attach a click-handler that
        o Toggles the button text between start/stop boat,
        o Toggles boatData.stopped between true and false
        o If boat is not stopped, schedules moveBoat()
      - defines a boat-mover, "moveBoat", that
        o Does nothing if boat is stopped.
        o Otherwise, calculates new position, moves boat, & schedules itself.
*/
    if (d.N > 0 && btnStartBoat  && btnStartBoat.disabled) {
      btnStartBoat.disabled = false;
      btnStartBoat.textContent = "Start Boat";
      $("#btnStartBoat").click(function(){
        if (typeof boatData === 'undefined') {
          var boatData = {position:position, timeSec:0, speedKts:3, stopped:false};
          boatData.el = document.getElementById("#boat");
        }
        if (!boatData.el) {alert("Internal error: I lost my boat! (no id=boat)");return;}
        if (btnStartBoat.textContent === "Start Boat"){
          btnStartBoat.textContent = "Stop Boat";
          boatData.stopped = false;
        } else {
          btnStartBoat.textContent = "Stop Boat";
          boatData.stopped = true;
        }
        if (!boatData.stopped) {
          setTimeout(moveBoat, 1000, boatData);
        }
        function moveBoat(boatData){
          alert("do position calcs here.");
          if (boatData.stopped) return;
          setTimeout(moveBoat, 1000, boatData);
        }
     });
   }
  d.N += 1;
};

  MYSTUFF.dragHandlers = function(){
    var $target
    var $index;
    return{start:function(event, ui){
                  $index = $(event.target).attr('id');
                  $index = $index.split("t")[1];
                  },
           drag: function(event, ui){
                 var position = MYSTUFF.eventXyToChartXy(event);
                 MYSTUFF.waypointData[$index].xyLoc = {x:position.x, y:position.y};
                 MYSTUFF.connectWaypoints();
           },
           stop: function(event, ui){
                 var position = MYSTUFF.eventXyToChartXy(event);
                 MYSTUFF.waypointData[$index].xyLoc = {x:position.x, y:position.y};
                 MYSTUFF.connectWaypoints();
           }
      };             
  };
  
  MYSTUFF.onStart_waypt = function(event, ui){
    var waypt = event.target;
    //var id = event.target.attr('id');
  };
  
  MYSTUFF.onDrag_waypt = function(event, ui){
  };
  
  MYSTUFF.onStop_waypt = function(event, ui){
  };
  
  MYSTUFF.reConnectWaypoints = function(){
    alert("reconnect waypoints");
    MYSTUFF.connectWaypoints();
  };
  
  MYSTUFF.connectWaypoints = function() {
//  Connect waypoints with a line.  Remember waypointData[N=1] is first element, first line is from [1] to [2].
    var canvas = document.getElementById("wayPtCanvas");
    var ctx = canvas.getContext("2d");
    var d = MYSTUFF.createWaypoint.data.waypoints;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var N = 1; N < d.length;N++){
      MYSTUFF.drawLine(d[N-1].position, d[N].position,ctx);
    }
  };
  
  MYSTUFF.addVessel = function(waypointId, imgFile,top, left){
  /* 
   * Appended to chartPosRef, the boat's position is relative to the ULC of the Chart.
   *     "    "  waypointId,  it is relative to the waypoint div.
   * Positioned "relative"
  */
    var el = $("#waypt1");
    var y = top + 200 + "px";
    var x = left + "px";
    var vessel = $('<img>').css({"z-index:3;position":"absolute", "top":top, "left":top})
          .attr({id:"boatPic", "src": MYSTUFF.imgDir + "/" + imgFile, "data-vesselXY":{x:x, y:y, parent:waypointId}});
    el.append(vessel);
    //$("#chartPosRef").append(vesselImg);
  }
  
  MYSTUFF.putVesselInWaypoint=function(){
  //Get the old (x,y), which represents position in a waypoint,
  //and overwrite the position-on-a-track.
    var vessel = $("#boatPic");
    if (!vessel) return;
    var oldXY = vessel.attr("data-vesselXY");
    vessel.attr("data-vesselXY",{x:vessel.css("left"), y:vessel.css("top")});
    vessel.css("top", oldXY.y);
    vessel.css("left", oldXY.x);
    $("#" + oldXY.parent).append(vessel);
  };
  
  MYSTUFF.writeStdPointDataToConsole = function(event){
    var chartXY = MYSTUFF.eventXyToChartXy(event);
    var yada = "";
    for (var nPt = 0; nPt < MYSTUFF.stdPoints.length; nPt++){
      if (nPt == 1267) {
          yada = "cursor: " + chartXY.x + "," + chartXY.y;
      }
      if ((Math.abs(chartXY.x - MYSTUFF.stdPoints[nPt][1]) < 20)){
        console.log(yada + " is near stdPoint " + nPt + ", x,y = " + MYSTUFF.stdPoints[nPt][1] + "," + MYSTUFF.stdPoints[nPt][0] );
        if(Math.abs(chartXY.y - MYSTUFF.stdPoints[nPt][0]) < 20) {
        MYSTUFF.display('stdPtNumber', ", Pt " + nPt + " at (x,y) = " + MYSTUFF.stdPoints[nPt][1] + "," + MYSTUFF.stdPoints[nPt][0])
        return;
        }
      }
    }
    return;
  }
  
  MYSTUFF.display = function(elId, text){
    var el = document.getElementById(elId);
    el.textContent = text;
  }
  
  MYSTUFF.myCanvas_mouseclick = function(event){
    var position;
    if(event.shiftKey){
      MYSTUFF.writeStdPointDataToConsole(event);
      return;}
    if(event.ctrlKey) {return;}
    if(event.altKey)  {return;}
  //No modifier key:
    position = MYSTUFF.eventXyToChartXy(event);//position must be {x:xPixels, y:yPixels}.
    
    return;
  };
  
  MYSTUFF.myCanvas_mousemove = function(event){
    var el;
    el = event.target;
    console.log("Mouse move detected by element id " + el.id);
    MYSTUFF.reportLatLong(event);
  };
  
  MYSTUFF.trackCanvas_mousemove = function(event){
    var el;
    el = event.target;
    console.log("Mouse move detected by element id " + el.id);
    MYSTUFF.reportLatLong(event);
  };
  
  MYSTUFF.trackCanvas_mouseclick = function(event){
  var position;
    if(event.shiftKey){
      position = MYSTUFF.eventXyToChartXy(event);
      MYSTUFF.createWaypoint(position);
      return;}
    if(event.ctrlKey) {return;}
    if(event.altKey)  {return;}
  //No modifier key:
  //  MYSTUFF.createWaypoint(event);
  };

$("#myCanvas").on("mousemove",MYSTUFF.myCanvas_mousemove);  // handler invokes reportLatLong to put mouse loc on page
$("#myCanvas").on("click",MYSTUFF.myCanvas_mouseclick);     // handler invokes various, depending on shift, ctrl & alt keys

$("#trackCanvas").on("click", MYSTUFF.trackCanvas_mouseclick);
$("#trackCanvas").on("mousemove",MYSTUFF.trackCanvas_mousemove);
var el;
el = $("#myCanvas");
if ("onmousemove" in el) {
  console.log("mousemove is in element");
} else {
  console.log("mousemove is not in element!");
}
if ("onmousemove" in window) {
  console.log("mousemove is in window");
} else {
  console.log("mousemove is not in window!");
}
/*******************************************************************
*
*   Code related to table id="markData"
*
/******************************************************************/

    $("#markDataCloseGif").on("click",MYSTUFF.closeWaypointInfo);
    $("#markData").draggable();
    $("#markData").hide();
/******************************************************************
                END OF MARKDATA CODE
/******************************************************************/

/*********************************************
*
*    Code to resize and scroll chart
*
**********************************************/
$('.resizeable').resizable();
console.log("end of Initialize(), try to scroll");
$("#chartScroll").scrollTop(1500).scrollLeft(2500); //Scroll chart so reasonable part is visible.
$("#chartScroll").scrollTop(1500).scrollLeft(2500); //Scroll chart so reasonable part is visible.
};
  //end-of-initialize