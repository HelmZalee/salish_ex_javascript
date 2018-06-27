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
  
  root:null, //Root of current nodes.  Set in http request handler, see parseStdPoints
  
  appendP:function(id, text) {
  //Put "text" in a <p>, and append that p to the element with the given id.
    var p, parent, para, t;
    p = document.getElementById(id);
    if (p === null) {
      alert("appendP: Element id = " + id + " not found.");
      return;
    }  
    parent = p.parentNode;
    if (p.nodeName !== "P" || parent.nodeName !== "DIV") {
      alert(text + ":replaceP(id, text) expects id '" + id + "' to identify a <p> element which is a child of a <div> element.  Here, the expected P is a '"  + p.nodeName + "' and the expected div is a '" + parent.nodeName + "'");
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
  if (p.nodeName !== "P") {
    alert(text + ":replaceP(id, text) expects id '" + id + "' to identify a <p> element.");
  }
  parent = p.parentNode;
  parent.removeChild(p)
  newP = document.createElement("P");
  newP.id = id;
  tNode = document.createTextNode(text);
  newP.appendChild(tNode);
  parent.appendChild(newP);
  },
  
  replaceText:function(id, text){ //stackoverflow.com/questions/3172166/getting-the-contents-of-an-element-without-its-children
    var el = document.getElementById(id);
    if (el === null) {
      alert("replaceText: Element id = " + id + " not found.");
      return;
    }
    el.firstChild.nodeValue = text;
  },
  
  stdPointsView:undefined,
  
  root:null,
  
  node: function(X,Y,currents){ //replaces class & constructor in old mystuff2
//  https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
//  Scroll down to Eduardo Cuomo (and Jaskey, and others)
    this.X = X;
    this.Y = Y;
    this.leftChild = null;
    this.rightChild = null;
    this.currents = currents;
    mycode.node.talk = function(){alert("Hi");};
    mycode.node.lon = function(x){return 125.1932131 - x*0.000815245184958729;};
    mycode.node.lat = function(y){return 49.4135887961735 - y*0.00053862726962142;};
    mycode.node.dPxSq = function(x, y, aNode) { var d =
    (x-aNode.X)*(x - aNode.X) + (y - aNode.Y)*(y - aNode.Y);
     return d;};
    mycode.node.dPx = function(oNode1, oNode2){return Math.sqrt(mycode.node.dPxSq(Node1, Node2));};
    },
    
  parseStdPoints: function(){
    var oReq = new XMLHttpRequest();
    var nodeCount;
/*
     Backup: For code prior to changes made to read "stdCurrents", see mystuff2.js.changepoint.
*/
    oReq.open("GET","currentPoints/stdCurrents.bin", true) 
    oReq.responseType = "arraybuffer";
    oReq.onload = function (oEvent) {
      var arrayBuffer = oReq.response; // Note: not oReq.responseText
      
      if (arrayBuffer) {
        var byteArray = new Uint8Array(arrayBuffer);
        var uShortArray = new Uint16Array(arrayBuffer);
        var BOM = uShortArray[0];
        var strLen = byteArray[2];
        var byteOffset = 3 + strLen;
        var currentRecArray = new Uint16Array(arrayBuffer, byteOffset);
        currentRecArray.start = 0;
        mycode.root = mycode.deserialize(currentRecArray);
        nodeCount = mycode.traverse(mycode.root, 0);
        mycode.replaceText("currentLoadStatus", "Current tree of " + nodeCount + "nodes constructed.");
        setTimeout(mycode.showAnimationDates, 4000);
        }
    }
    oReq.addEventListener("progress",function(oEvent){
      if (oEvent.lengthComputable){mycode.replaceText("currentLoadStatus","current data load " + (Math.floor(0.5 + (oEvent.loaded/oEvent.total)*100)) + "% complete");}});
      
    oReq.addEventListener("load",function(oEvent){mycode.replaceText("currentLoadStatus","Current data loaded, building current tree....");
      });
    oReq.addEventListener("error",function(oEvent){mycode.replaceText("currentLoadStatus","An error occurred");});
    oReq.addEventListener("abort",function(oEvent){mycode.replaceText("currentLoadStatus","loading aborted");});
    oReq.send();
  },
  
  deserialize: function(oStream) {  //from demo
    var record;
    var oNode;
    if (oStream.EOF) return null;
    oNode = mycode.readLine(oStream);
    if (oNode == null) return null;
    oNode.leftChild  = mycode.deserialize(oStream);
    oNode.rightChild = mycode.deserialize(oStream);
    return oNode;
  },

  readLine: function(buffer){        //from demo                   // in mystuff2, readline reads:
    var line, X, Y, spdHdg, current, nCurrent;                     //     index, lat, lon, currents[]
    if (buffer.start >= buffer.byteLength) return mycode.ETX;       //     all as Uint16.
    X = buffer[buffer.start++];
    if (X == 65535) return null;
    Y = buffer[buffer.start++];
    current = [];                                                 //  mystuff2.Node       mycode.node (a function(X, Y, Currents)
    nCurrent = 0;                                                 //  lat                 Y
    for (nCurrent = 0; nCurrent < 43; nCurrent++){                //  lon                 X
      current.push(buffer[buffer.start++]);                       //  parent              -
      }                                                           //  nextLeft            leftChild
    return new mycode.node(X,Y,current)                           //  nextRight           rightChild
  },                                                              //  currents []         currents[]
  
  Iterator:function(root) {
/*
  See 'how to build an iterator.txt.  This originated as iterateOverTree.
  The constructor descends each leftChild up to, but not including, 
  the node with no left child, pushing each node it encounters (save the last)
  onto the stack.  The left-childless node remains as 'next'.
  
  hasNext() merely returns 'next'
  
  next() returns the current 'next' and generates its successor.  That
  successor is the next node on the stack if that node has no rightChild.
  If the next node on the stack does have a right child, descend by leftChild
  to the last leftChild, as was done initially, ie, placing each node on the
  stack as we go.  The last leftChild will be at the top of the stack.
*/  
    var next = root;
    var nxt;
    var stack = [];
  
    while (next !== null){
      stack.push(next);
      next = next.leftChild;
    }
    
    if (stack.length > 0) {next = stack.pop();}
    return( {  
      hasNext:function() {return (next !== null);},
    
      next: function() {
      nxt = next;
      if (next.rightChild !== null) {
        next = next.rightChild;
        while (next!==null) {
        stack.push(next);
        next = next.leftChild;
        }
      }
      if (stack.length < 1){
        next = null;  //do this instead...
        return nxt;
      }
      next = stack.pop();
      return nxt;
      }
   });
  },
 
  testIterator: function(){
    var node;
    var count = 0;
    var iterate = mycode.Iterator(mycode.root);
    while (iterate.hasNext()) {
      count++;
      node = iterate.next();
    }
    mycode.appendP("debugOutput", "Node count:" + count);
    return count;
  },
  traverse: function(root, count) { //from demo
//  Traverse tree to count nodes.  Invoke with traverse(null, root, count)
    var iterate = mycode.Iterator(root);
    while (iterate.hasNext()) {
      count++;
      node = iterate.next();
    }
    return count;
/*======== old code 
    if (root === null) return count;
    root.parent = parent;
    count++;
    count = this.traverse(root.leftChild, count);
    count = this.traverse(root.rightChild,count);
    return count;
/***********************/    
    }, 

  showAnimationDates:function(){
// unhide boxes to hold start/stop dates and node count. 
      var el = document.getElementById("currentLoadStatus");
      el.style.visibility="collapse";
      el = document.getElementById("animationDates");
      el.style.visibility="visible";
  },
  
  findNearestNode: function(x, y) {
  /*
    Kick off descent, recording "min dist" at first leaf.  Subsequently, at each vertex, compare distance-to-xy.  Then determine whether descending could possibly find a smaller distance.  NOTE the first split (ie, the split at the root) is on Lat, by construction of the serialized file.
  */
    const huge = 1E30;
    var splitOnLat = false;   // Reverse on entry or departure from findNearest.
    var oNearNodes;           // oNearNodes records a list of up to max nodes near (x, y).
                              // oNearNodes.minDist[n]=SQ of n-th min d found. ~.nodes[n] is the node.
    oNearNodes = {nLine:0, x:x, y:y, count:0, max:5, minDist:[], nodes:[]};
    for (var i = 0; i < oNearNodes.max; i++){
//    The length of this array is held constant.  If it is 5, then I find the five nearest currents.    
      oNearNodes.minDist[i] = huge;
      oNearNodes.nodes[i] = mycode.root;
      }
    findNearest(oNearNodes, mycode.root, splitOnLat);
    for (var i = 0; i < oNearNodes.minDist.length; i++) {
      oNearNodes.minDist[i] = Math.sqrt(oNearNodes.minDist[i]);
      }
    return oNearNodes;
    },
    
    findNearestNode: function(x, y) {
  /*
    Kick off a leftfirst/depth first descent. Record "min dist" at first leaf.  Subsequently, at each vertex, compare distance-to-xy.  Then determine whether descending could possibly find a smaller distance.  NOTE the first split (ie, the split at the root) is on Lat, by construction of the serialized file.
  */
    const huge = 1E30;
    var splitOnLat = false;   // Reverse on entry or departure from findNearest.
                              // oNearNodes records a list of up to max nodes near (x, y).
                              // oNearNodes.minDist[n]=SQ of n-th min d found. ~.nodes[n] is the node.
    var oNearNodes = {nLine:0, x:x, y:y, count:0, max: 5, minDist:[], nodes:[]};
    for (var i = 0; i < oNearNodes.max; i++){
//    The length of this array is held constant.  If it is 5, then I find the five nearest currents.    
      oNearNodes.minDist[i] = huge;
      oNearNodes.nodes[i] = null;
      }
    mycode.findNearest(oNearNodes, mycode.root, splitOnLat);
    for (var i = 0; i < oNearNodes.minDist.length; i++) {
      oNearNodes.minDist[i] = Math.sqrt(oNearNodes.minDist[i])*MYSTUFF.mPerPixel;
      }
    return oNearNodes;
    },
    
    findNearest:function(oNearNodes, vertex, splitOnLat) {
    // Traverse till we can go no further, which defines the initial minimum distance.
    // Then back up tree, looking to see if the branch not taken could possibly contain a closer node.
      var d, dx, dy, dSq;
      var goLeft;
      var child;
      splitOnLat = !splitOnLat;  

//    If no min distance has been set, continue to attempt descent:    
      if (oNearNodes.minDist[0] >= 1E30){
//      Still on initial descent, looking for leaf.  Which way next?
        goLeft = splitOnLat ? oNearNodes.y < vertex.Y : oNearNodes.x < vertex.X;
        if (goLeft) {
          if (vertex.leftChild !== null) {
//          Continue looking for first leaf
            mycode.findNearest(oNearNodes, vertex.leftChild, splitOnLat);
            }
          } else {
            if (vertex.rightChild !== null) {
//          Continue looking for first leaf
              mycode.findNearest(oNearNodes, vertex.rightChild, splitOnLat);
              }
            }
          }
//      We're backing out.  Look down untraveled branches as we go.
//      Consider the current node (on the way down, we ignored these non-terminal nodes):
        d = mycode.node.dPxSq(oNearNodes.x, oNearNodes.y, vertex);
        insertIfMinD(d, vertex, oNearNodes);
        
//      Now, if the last time we went right, consider the left node, and vice-versa:  
        child = goLeft ? vertex.rightChild : vertex.leftChild;
        if (child == null) return;
        
        dx =  Math.abs(child.X - oNearNodes.x);         
        dy =  Math.abs(child.Y - oNearNodes.y); 
        d = splitOnLat ? dy : dx;
        dSq = d*d;
//      True dSq = dy2 + dx2.  If this dSq !< minDist, dx2 + dy2 !< minDist & we can ignore...        
        if (dSq < oNearNodes.minDist[oNearNodes.max - 1]) {
//        ...but we cannot ignore, we have to get the actual dx2 + dy2:        
          mycode.findNearest(oNearNodes, child, splitOnLat);
          }
      return;

      function insertIfMinD(d, oNode, oNearNodes){
//    Caller has calculated the oNode is at a distance d from oNearNodes.x, oNearNodes.y.
//    IFF this new d is less than some minDist[] already in the list, put the new d into the list.
        var lastD = oNearNodes.count;
        if(oNearNodes.minDist[lastD] < d) return -1;
        var inc = lastD < oNearNodes.max ? 1 : 0;    // Do not increment .count if doing so would make it >= .max.
        for(var i = 0; i < oNearNodes.minDist.length; i++){
          if (d < oNearNodes.minDist[i]) {
          //Insert at i, deleting 1 item to keep count <= 10
            oNearNodes.count = oNearNodes + inc;
            oNearNodes.minDist.splice(i, 1, d);
            oNearNodes.nodes.splice(i, 1, oNode);            return i;
            }
          }
        }
      }
};
//====================================    
    
var MYSTUFF = {wayPtBlockClick:false, boatIcon:null, boatImg:"greendot.gif", waypointMark:"reddot.gif", coursePointMark:"coursePoint.gif", imgDir:"charts", bool:true};

MYSTUFF.chartDatum = [];

/* Setup is run on document ready; see the html. */
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
    var twoPi = 2*Math.PI;
    var radToDeg = 180.0/Math.PI;
    var degToRad = 1.0/radToDeg;
    var wayptData;
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
    MYSTUFF.cVector[speed] = {desc:"still water", min:0, max:0,
                              x:[ -3, 3, 0,  0,  0, 0,-3, 0, 0],      /* PLUS */
                              y:[  0, 0, 0, -3, +3, 0, 0, 0, 3]};
    speed = 1;
    lengthBase = 7;
    
    length = speed + lengthBase;
    MYSTUFF.cVector[speed] = {desc:"< 0.25kt", min:0, max:0.25,
                              x:[-0, -0, -a, 0, +a, 0, 0],            /* No feathers */
                              y:[0, -length, -length, -(length + 5), -length, -length, 0]};

    speed = 2; /* one feather (0 is a plus, 1 is no feathers) */
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"0.25 - 0.50kt", min:0.25, max:0.5,
                              x:[0,   0, -4,  0,  0,       -a,       0,            +a,       0,      0],
                              y:[0,  -2,  0, -2,  -length, -length, -(length + 5), -length, -length, 0]};

    speed = 3; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"0.50 - 0.75kt", min:0.5, max:0.75,
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s,      -a,       0,            +a,       s,       s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -length, -length,  -(length + 5), -length, -length, 0]};

    speed = 4; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"0.75 - 1.00kt", min:0.75, max:1.0,
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,       -s,      -a,       0,            +a,       s,       s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,        -length, -length,  -(length + 5), -length, -length, 0]};

    speed = 5; /* 4 feathers, all on the same side */
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"1.00 - 1.25kt", min:1.0, max:1.25,
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,       s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length, 0]};

    speed = 6; /* 5 feathers (4 on one side, 1 on other)*/
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"1.25 - 1.50kt", min:1.24, max:1.5,
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,         s, 5,  s,  s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length,  -2, 0, -2,  0]};

    speed = 7; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"1.50 - 2.00kt", min:1.5, max:2.0,
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,        s,   5,  s,  s, 5, s,  s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length, -4,  -2, -4, -2, 0, -2,  0]};

    speed = 8; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"2.00 - 2.50kt", min:2.0, max:2.5,
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,         s,   5,  s,   s,  5,  s,   s, 5, s, s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length,  -6,  -4, -6,  -4, -2, -4,  -2, 0, -2,  0]};
    speed = 9; 
    length = lengthBase + speed;
    MYSTUFF.cVector[speed] = {desc:"> 2.50kt", min:2.5, max:2.5,
                              x:[-s,   -s, -5, -s,  -s, -5, -s,  -s, -5, -s,  -s, -5, -s,      -s,      -a,       0,            +a,       s,        s, 5, s,     s,   5,  s,   s,  5,  s,   s, 5, s, s],
                              y:[ 0,   -2,  0, -2,  -4, -2, -4,  -6, -4, -6,  -8, -6, -8,      -length, -length,  -(length + 5), -length, -length, -8, -6, -8,  -6,  -4, -6,  -4, -2, -4,  -2, 0, -2,  0]};
    speed = 10;// non-existant.  6/24/2018 to handle case of non-existant data, spdHdg = 65535 see lines ~835ff         
    MYSTUFF.cVector[speed] = {desc:"dry/no data", min:0, max:0,/* horizontal line to represent no water */
                              x:[-a, a],
                              y:[0, 0]};
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
 //       if (typeof MYSTUFF.stdPoints === 'undefined') {
 //         alert("mystuff2 line 678: should not be here!");
 //         MYSTUFF.stdPoints = GETCURRENTDB.getstdcurrentpoints();
 //       } else {
 //       }
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

//    Establish checkpoint for restarting animation, and for driving boat course:      
      MYSTUFF.animation.tides = sequence;
      MYSTUFF.animation.tideNow = nSeq;
      MYSTUFF.patternNow = nChart;
      if (document.getElementById("btnFreezeContinue").innerHTML === "Continue") {
        return;
      }
      ctx.clearRect(0,0,/*450,400,*/ canvas.width, canvas.height);     //Clear Canvas, except for Key, whose LRC is about (450, 400) 
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
      var iterator = mycode.Iterator(mycode.root);
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
    //  x = vertex.X; //.lon;              6/24/2018: Current points structure, written by stdCurrents.sln
   //   y = vertex.Y; //.lat;              is X,Y as pixels from ULC of Chart 18400 (not lat, lon) AND
      speed = vertex.currents[chart]; // currents[nChart] = (512 * datum.speed + datum.heading as uint16
      if (speed > 5000) {
         speed = 10;
         heading = 0;
      } else {
        speed = Math.trunc(vertex.currents[chart]/512);  // expect 0...9
        heading = vertex.currents[chart] - (speed * 512);
      }
  //  heading = Math.trunc(speed/10); // max 
  //  speed = speed - heading*10;
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
      ctx.translate(vertex.X, vertex.Y); //was (xyLoc[1], xyLoc[0]
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
      mycode.appendP("debugOutput", "Drawing from "  + fromXy.x + ", "  + fromXy.y + " to "  + toXy.x + "," + toXy.y);
      ctx.moveTo(fromXy.x, fromXy.y);
      ctx.lineTo(fromXy.x, fromXy.y);
      ctx.lineTo(toXy.x, toXy.y);
      ctx.stroke();
    };
    
    MYSTUFF.showStdCurrents = function(){
//  Traverse tree to count nodes.  Invoke with traverse(null, root, count)
    var root = mycode.root;
    var traverse = function(node){
      if (node === null) return;
      MYSTUFF.drawCircle(node.X, node.Y);
      traverse(node.leftChild);
      traverse(node.rightChild);
      return;
      }
    traverse(root);
    },
     
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
    
     MYSTUFF.drawCircle = function(pX, pY){
/**********************************************************
     see drawArror in mystuff2.js.changepoint
***********************************************************/
      var cRadius = 2;
      var cStartAngle = 0;
      var cEndAngle = 2*Math.PI;
      var cDirection = 0; //cw or ccw
      
      canvas = document.getElementById("myCanvas");
      ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(pX, pY, cRadius, cStartAngle, cEndAngle, cDirection);
      ctx.fillStyle = 'blue';
      ctx.fill();
      ctx.stroke();
      return;
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
        MYSTUFF.feetPerLatPixel = MYSTUFF.degLatPerPixel * MYSTUFF.feetPerDegLat;  //-196.36583552952646
        MYSTUFF.feetPerLonPixel = MYSTUFF.degLonPerPixel * MYSTUFF.feetPerDegLon;  //-198.10121819008344
        MYSTUFF.mPerPixel = MYSTUFF.feetPerLatPixel * (-0.3048); // ? lat & lon ft per px sb same???
        MYSTUFF.ulc_latitude = Math.max(data.LAT1,data.LAT2) - MYSTUFF.degLatPerPixel*Math.min(data.LAT1PX, data.LAT2PX);
        MYSTUFF.ulc_longitude =Math.max(data.LON1,data.LON2) - MYSTUFF.degLonPerPixel*Math.min(data.LON1PX, data.LON2PX);
        MYSTUFF.referenceLatitude = data.PP;
        MYSTUFF.nmPerDegLon = 60.012;  // nm per degree of latitude    astronavigationdemystified.com 
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

    MYSTUFF.createWaypoint = function(position) {
/*****************************************************
    Create a waypoint (image) at position and connect waypoints.
    Also: Maintain waypoint position data
          Define functions to 
           o Enable/Disable 'Start Boat' button, as appropriate.
           o Deal with dragging the waypoints
           o Connect the waypoints
    This function contain the definitions of multiple other functions:
      o setUpBoat(x, y)
      o anonymous btnStartBoat click handler, which also contains:
        - moveBoat
        - heading()
        - positionBoat()
        - NmSqToNextWpt(nextWaypt) (Nautical miles squared to next waypoint)
      o connectWaypoints()
      o dragHandlers, which also contains (returns object containing)
         - anonymous start, drag and stop handlers
*******************************************************/
    var imgPath = MYSTUFF.imgDir + "/" + MYSTUFF.waypointMark;
    var wayPtImg;
    var wayPoints;
    var $yada;
    var N, top, left, wayPtId, oImgCss, oImgAttr;
    
    if (typeof wayptData === 'undefined') {
//    Correct values of wayPtImg dimensions below, after we have the first waypoint and its image.      
      wayptData = {wayPoints:[], image:{height:10, width:11, halfHt:5, halfWd:5} };
      }
    wayPoints = wayptData.wayPoints;
    wayPtImg = wayptData.image;  //will wayptData.image.height change if wayPtImg.height is set???
    N = wayPoints.length;
 //   if (N === 0) {position.x = 2600; position.y=1900;}//debug
//    if (N === 1) {position.x = 2700; position.y=1825;}//debug
//    if (N === 2) {position.x = 2756; position.y = 1825;}//debug
    wayPoints[N] = {x:position.x, y:position.y} 
    
    top = wayPoints[N].y - wayPtImg.halfHt;
    left = wayPoints[N].x - wayPtImg.halfWd;
    wayPtId = "waypt" + N;
    oImgCss  = {"z-index":3, "position":"absolute", "left":left + "px", "top":top + "px", };
    oImgAttr = {id:wayPtId, "class":"wayptMarker","src": imgPath, "title":"Way Pt " + N}
  //img = $('<img>').css(oImgCss).attr(oImgAttr).draggable(dragHandlers());
  //$("#chartPosRef").append(img);
    $("#chartPosRef").append($('<img>').css(oImgCss).attr(oImgAttr).draggable(dragHandlers()));

    if(N === 0) {
//    Do not have image size when we build the first waypoint; correct that: 
//    I have no idea what's going on, but this (usuall) assigned 0 to wayPtImg.height, 
//    even when they were explicitly assigned 10 and 11 above. 
   //   wayPtImg.height = $('#waypt0').height();
   //   wayPtImg.width = $('#waypt0').width();
   //   wayPtImg.halfHt = Math.floor(wayPtImg.height/2 + 0.5);
  //    wayPtImg.halfWd = Math.floor(wayPtImg.width/2 + 0.5);
      top = position.y - wayPtImg.halfHt; //top & left calculated above are not correct when N == 0.
      left = position.x - wayPtImg.halfWd;
      $('#waypt0').css('top', top + "px").css('left', left + "px");
    }

    mycode.appendP("debugOutput", "Pt " + wayPtId + " positioned at " + left + ", " + top);
    connectWaypoints();
    if (N === 1) setUpBoat(wayPoints[0].x, wayPoints[0].y);
    return;
    
    function setUpBoat(x, y) {
/*
    Invoked when createWaypoint creates the second waypoint (because two define a direction).
    X and y are the coordinates of the center of the first waypoint.     
    If waypts >= 2, & a 'start boat' button, & the button is disabled, then:
        - enable & relabel the button "start boat"
        - attach a click-handler that
          o Toggles the button text between start/stop boat,
          o Toggles boatData.stopped between true and false
          o If boat is not stopped, schedules moveBoat()
        - defines a boat-mover, "moveBoat", that
          o Does nothing if boat is stopped.
          o Otherwise, calculates new position, moves boat, & schedules itself.
    See 'pixels to nautical miles.xlsx' for the 'algorithm' and structure of 'boatData'
*/      
 // var boatData;       //initialized in btnStartBoat click handler; stores position data.
    var btnStartBoat;                                       //(deg/pixel)*(nm/deg) ==> nm/deg:
    var nmPerPixel = Math.abs(MYSTUFF.degLatPerPixel*60.0); //60 nm = 1° of lat.  dToNxtWptNm(nm) is same V  directions.
    var pxPerNm = 1.0/nmPerPixel;
    var nmPerPixelSq = nmPerPixel*nmPerPixel;
    var nWaypt;
    var timeScaleSecPerHr = 10;
    var updateFreqSec = 2;
    var pixelsPerNm =30.9;
    var stepSizeHours = updateFreqSec/timeScaleSecPerHr;
    btnStartBoat = document.getElementById("btnStartBoat");
    if (N > 0 && btnStartBoat  && btnStartBoat.disabled) {
      nWayPt = 1;
      btnStartBoat.disabled = false;
      btnStartBoat.textContent = "Start Boat";
      $("#btnStartBoat").click(function(){
        var boatData;             // available only by passing
        var dToNxtWptPx, dx, dy;
        var spdBoatKts;
        var hdgBoatRad, sinHdgBoat, cosHdgBoat ;
        var dxDtBoatKtsOverWater, dyDtBoatKtsOverWater;
        var spdHdg;
        var spdCurKts;
        var hdgCurRad,  sinHdgCur, cosHdgCur;
        var dxDtCurKts, dyDtCurKts;

//      Components of speed (kts) and distance (Pixels) over a step:        
        var dxDtNetOverGroundKts, dyDtNetOverGroundKts;
        var dxNetOverStepPx, dyNetOverStepPx;
        /* 
        ToDo: when user stops the boat, then clicks "start boat", it will start all over again.
              He should have the choice of continuing as well, but two choices need a second button.
              
              Also, I don't think it will continue to a third waypoint.
        */
        if (btnStartBoat.textContent == "Stop Boat"){
          btnStartBoat.textContent = "Start Boat";
          return;
          }
        dx = wayPoints[1].x - wayPoints[0].x;
        dy = wayPoints[1].y - wayPoints[0].y;
        dToNxtWptPx  = Math.sqrt(dx*dx + dy*dy);
        
//      See pixels to nautical miles.xls for heading calculations.        
        hdgBoatRad = (5*Math.PI/2 - Math.atan2(-dy,dx)) % (2*Math.PI);
        sinHdgBoat = Math.sin(hdgBoatRad - Math.PI/2);
        cosHdgBoat = Math.cos(hdgBoatRad - Math.PI/2);
        spdBoatKts = 3;
        dxDtBoatKtsOverWater = spdBoatKts*cosHdgBoat;
        dyDtBoatKtsOverWater = spdBoatKts*sinHdgBoat;
        
        
        spdCurKts = 0;
        hdgCurRad = 0;
        sinHdgCur = Math.cos(hdgCurRad - Math.PI/2);
        cosHdgCur = Math.cos(hdgCurRad - Math.PI/2);
        dxDtCurKts = spdCurKts*cosHdgCur;
        dyDtCurKts = spdCurKts*sinHdgCur;
        
        dxDtNetOverGroundKts = dxDtCurKts + dxDtBoatKtsOverWater;
        dyDtNetOverGroundKts = dyDtCurKts + dyDtBoatKtsOverWater;
        dxNetOverStepPx = dxDtNetOverGroundKts*pixelsPerNm*stepSizeHours;
        dyNetOverStepPx = dyDtNetOverGroundKts*pixelsPerNm*stepSizeHours;
        
        if (typeof boatData === 'undefined') {
          boatData = {updateFreqSec:updateFreqSec,
                      stepTimeSec:updateFreqSec,
                      pixelsPerNm:pixelsPerNm,
                      xPx:x, yPx:y, hrsFromLastWpt:0, hrsFromStart:0, closingSpdKts:3, 
                      closingTimeHrs:0,
                      dToNxtWptPx : dToNxtWptPx,
                      dToNxtWptNm: dToNxtWptPx * nmPerPixel,
                      spdCurKts:spdCurKts,
                      hdgCurRad:hdgCurRad,
                      sinHdgCur:sinHdgCur,
                      cosHdgCur:cosHdgCur,
                      dxDtCurKts:dxDtCurKts,
                      dyDtCurKts:dyDtCurKts,
                      hdgBoatRad:hdgBoatRad,
                      hdgBoatDeg:hdgBoatRad*180/Math.PI,
                      spdBoatKts:spdBoatKts,
                      sinHdgBoat:sinHdgBoat,
                      cosHdgBoat:cosHdgBoat,
                      dxDtBoatKtsOverWater:dxDtBoatKtsOverWater,
                      dyDtBoatKtsOverWater:dyDtBoatKtsOverWater,
                      dxDtNetOverGroundKts:dxDtBoatKtsOverWater+dxDtCurKts,
                      dyDtNetOverGroundKts:dyDtBoatKtsOverWater+dyDtCurKts,
                      dxNetOverStepPx:dxDtNetOverGroundKts*pixelsPerNm*stepSizeHours,
                      dyNetOverStepPx:dyDtNetOverGroundKts*pixelsPerNm*stepSizeHours,
                      closingSpeedKts:0, 
                      closingTimeHrs:0,
                      stopped:false};
          boatData.el = document.getElementById("boat");
          boatData.halfHeight = Math.floor(boatData.el.height/2 + 0.5);
          boatData.halfWidth = Math.floor(boatData.el.width/2 + 0.5);
          positionBoat(boatData);
          boatData.started = true;
        }
        
      if (!boatData.el) {alert("Internal error: I lost my boat! (no id=boat)");return;}
      if (boatData.started){
        btnStartBoat.textContent = "Stop Boat";
        boatData.stopped = false;
      } else {
        btnStartBoat.textContent = "Stop Boat";
        boatData.stopped = true;
      }
    if (!boatData.stopped) {
//    Put boat at starting point, wait a bit so the user can see it, then begin.      
      positionBoat(boatData);
      stepTimeSec = boatData.updateFreqSec;  //below, step time may be adjusted to arrive at waypoint.
      setTimeout(moveBoat, 2*1000, boatData);
      }
    return;
    });
    
    function moveBoat(boatData){
      var dx; // y pixels moved this step.  New position is (x+dx, y+dy)
      var dy; // x pixels moved this step
      var dToNxtWptNm;  // distance, nm, to next waypoint.
      var sog;// speed over ground (not necessarily in the right direction)
      var minTimeToMark; // time to mark, if the track gets us there!
      var title;
      
      if (boatData.stopped) return;  
      
//    Influence of current: find nearest current point, then get spdHdg at that point for this Chart/Pattern
      currentVector(boatData); //This calculates boatData.dxDtCurKts, ~.dyDtCurKts + ~.hdgCurRad, ~.sinHdgCur,~.cosHdgCur 
            
      boatData.dxDtNetOverGroundKts = boatData.dxDtCurKts + boatData.dxDtBoatKtsOverWater; // X-component: boat velocity + current velocity
      boatData.dyDtNetOverGroundKts = boatData.dyDtCurKts + boatData.dyDtBoatKtsOverWater; // Y-component...
      boatData.dxNetOverStepPx = boatData.dxDtNetOverGroundKts*pixelsPerNm*stepSizeHours;  // X-velocity, nm/hr, X pixels/nm X step-size hours
      boatData.dyNetOverStepPx = boatData.dyDtNetOverGroundKts*pixelsPerNm*stepSizeHours;  // Aren't these exactly dx, dy in the next lines??? debug check...
      
//    dx, dy are pixels just covered: (clock sec/step)* [Hours/(clock sec)]* [dx/dt nm/hr] * pixel/nm = pixels/step
      dx = (boatData.stepTimeSec/timeScaleSecPerHr)*boatData.dxDtNetOverGroundKts*boatData.pixelsPerNm;
      dy = (boatData.stepTimeSec/timeScaleSecPerHr)*boatData.dyDtNetOverGroundKts*boatData.pixelsPerNm;

      
      boatData.xPx = boatData.xPx + dx;
      boatData.yPx = boatData.yPx + dy;
//    Center boat on (boatData.xPx, ~.yPx)
      positionBoat(boatData);
      
//    How much further? If were within 2 pixels of a waypoint, head for next waypoint (or quit, if no more waypoints)
      dx = wayPoints[nWayPt].x - boatData.xPx;
      dy = wayPoints[nWayPt].y - boatData.yPx;
      boatData.dToNxtWptPx = Math.sqrt(dx*dx + dy*dy);
      boatData.dToNxtWptNm = boatData.dToNxtWptPx/pxPerNm;
      console.log("Distance to next waypoint (" + nWayPt + "):" + round(boatData.dToNxtWptPx,1) + "px");
      if (boatData.dToNxtWptPx < 2) {
        if (nWayPt + 1 < wayPoints.length) {
          nWayPt = nWayPt + 1;
          dx = wayPoints[nWayPt].x - boatData.xPx;
          dy = wayPoints[nWayPt].y - boatData.yPx;
          boatData.dToNxtWptPx = Math.sqrt(dx*dx + dy*dy);
          boatData.dToNxtWptNm = boatData.dToNxtWptPx/pxPerNm;
          heading(boatData);
          console.log("New track, length " + round(boatData.dToNxtWptNm,1) + "nm" + 
                      ", compass hdg " + round(boatData.hdgBoatDeg,1) + "°True");                      
        } else {
          alert("We have arrived");
          return;
        }
      }
  
//    If boat heading, or current, have changed, recalculate boat vector + current vector
      boatData.spdCurKts = 0;
      boatData.hdgCurRad = 0;
      boatData.sinHdgCur = Math.sin(boatData.hdgCurRad - Math.PI/2);
      boatData.cosHdgCur = Math.cos(boatData.hdgCurRad - Math.PI/2),
      boatData.dxDtCurKts = boatData.spdCurKts*boatData.cosHdgCur;
      boatData.dyDtCurKts = boatData.spdCurKts*boatData.sinHdgCur;
      
      boatData.dxNetOverStepPx = boatData.dxDtBoatKtsOverWater + boatData.dxDtCurKts;
      boatData.dyNetOverStepPx = boatData.dyDtBoatKtsOverWater + boatData.dyDtCurKts;
      
      boatData.dxDtNetOverGroundKts = boatData.dxDtBoatKtsOverWater + boatData.dxDtCurKts;
      boatData.dyDtNetOverGroundKts = boatData.dyDtBoatKtsOverWater + boatData.dyDtCurKts;
      
      console.log("dx/dt, dy/dt next step: " + round(boatData.dxNetOverStepPx,1) + ", " +
                                               round(boatData.dyDtNetOverGroundKts,1));
//    Can we make the mark at this speed, if we're going in the right direction?
      sog = Math.sqrt(boatData.dxDtNetOverGroundKts*boatData.dxDtNetOverGroundKts + 
                      boatData.dyDtNetOverGroundKts*boatData.dyDtNetOverGroundKts);
      minHrsToMark = boatData.dToNxtWptNm/sog;

      boatData.hrsFromLastWpt = boatData.hrsFromLastWpt + stepSizeHours;
      boatData.hrsFromStart = boatData.hrsFromStart + stepSizeHours;
      boatData.el.title = title;
      console.log("Hr frm strt:"  + round(boatData.hrsFromStart,1) + 
                  "Min time to mark: " + round(minHrsToMark,1) + " Hr")
      if (btnStartBoat.textContent == "Start Boat") {
        return;
      }
      if (boatData.dToNxtWptPx < 1) {
//      Arrived at a waypoint; calculate heading for next step or announce arrival
        if (nWayPt + 1 < wayPoints.length) {
          nWayPt += 1;
          alert("Reached intermediate waypoint, now what?");
          boatData.passedWaypoint = true;
        } else {
        alert("Arrived, now what?");
        
        }
      } else {
        if (minHrsToMark <= 1*stepSizeHours){
  //      Remaining distance is less than distance covered in this step.
  //      simTime = boatData.closingTimeHrs*timeScaleSecPerHr/simTime
          boatData.stepTimeSec = minHrsToMark*timeScaleSecPerHr;
          console.log("Setting stepTimeSec to " + round(boatData.stepTimeSec,2) + 
                         " to take boat exactly " + round(boatData.dToNxtWptNm,2) +
                         " nm to next waypoint.");
        } else {
//        simTime = boatData.updateFreqSec;
          boatData.stepTimeSec = boatData.updateFreqSec;
        }
      }
      if (boatData.dToNxtWptPx > 1) {
        setTimeout(moveBoat, boatData.stepTimeSec*1000, boatData);
      }
    // dpme/
    }
    
    function currentVector(boatData){
    // computations of the current contribution to speed-over-ground
    
      var cNodeList = mycode.findNearestNode(boatData.xPx, boatData.yPx);
      var cNode = cNodeList.nodes[0];
      var cSpdHdg = cNode.currents[MYSTUFF.animation.patternNow];
      var speedN = Math.trunc(cSpdHdg/512);
      boatData.spdCurKts = (MYSTUFF.cVector[speed].max - MYSTUFF.cVector[speed].max)/2.0;// Better to interpolate between max & min using time.
      var hdgCurDeg = cSpdHdg - speedN*512;
      boatData.hdgCurRad = hdgCurDeg*degToRad;
      boatData.sinHdgCur = Math.cos(boatData.hdgCurRad - Math.PI/2);
      boatData.cosHdgCur = Math.sin(boatData.hdgCurRad - Math.PI/2);
      boatData.dxDtCurKts = boatData.spdCurKts*boatData.cosHdgCur;
      boatData.dyDtCurKts = boatData.spdCurKts*boatData.sinHdgCur; 
    }      
    
    function heading(boatData){
//    Calculate the heading (angle of the track from Mark(n) to Mark(n+1))
//    as well as the sin, cos, hdgDeg, and x,y components of boat velocity:
      if (nWayPt >= wayPoints.length) return -1;
      var dx = wayPoints[nWayPt].x - wayPoints[nWayPt - 1].x;
      var dy = wayPoints[nWayPt].y - wayPoints[nWayPt - 1].y;
      hdgBoatRad = (5*Math.PI/2 - Math.atan2(-dy,dx)) % (2*Math.PI);  // Compass direction, not Cartesian direction
      boatData.hdgBoatDeg = boatData.hdgBoatRad * radToDeg;
      boatData.sinHdgBoat = Math.sin(hdgBoatRad - Math.PI/2);         // Sin of Cartesian (why?)
      boatData.cosHdgBoat = Math.cos(hdgBoatRad - Math.PI/2);
      boatData.dxDtBoatKtsOverWater = boatData.spdBoatKts*boatData.cosHdgBoat;
      boatData.dyDtBoatKtsOverWater = boatData.spdBoatKts*boatData.sinHdgBoat;
      return;
    }
    
    function positionBoat(boatData){
      mycode.appendP("debugOutput", "Put boat ctr at " + Math.trunc(boatData.xPx) + "," + Math.trunc(boatData.yPx));
      boatData.el.style.top = boatData.yPx - boatData.halfHeight + "px";
      boatData.el.style.left = boatData.xPx - boatData.halfWidth + "px";
    }
    function PxToNextWpt(xPx, yPx, nWayPt){
      if (nWayPt >0 && nWayPt <=  wayPoints.length) {
        var dx = wayPoints[nWayPt].x - x;
        var dy = wayPoints[nWayPt].y - y;
        var dist = Math.sqrt((dx*dx + dy*dy)); //debug
        return(dx*dx + dy*dy);
      } else {
        return;
      }
     }
     
    function round(number, precision) {
//    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round#A_better_solution      
      var shift = function (number, precision) {
      var numArray = ("" + number).split("e");
      return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
      };
    return shift(Math.round(shift(number, +precision)), -precision);
}
   }
 }
    function connectWaypoints() {
//    Connect waypoints with a line.
      var canvas = document.getElementById("wayPtCanvas");
      var img;
      var ctx = canvas.getContext("2d");
      
      var pos1 = {x:wayPoints[0].x, y:wayPoints[0].y};
      var pos2;
      
      img = document.getElementById('waypt0');
      pos1.img = img;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var N = 1; N < wayPoints.length;N++){
        img = document.getElementById('waypt' + N);
        pos2 = {x:wayPoints[N].x, y:wayPoints[N].y, img:img};
        
        mycode.appendP("debugOutput",
        "Pt " + (N-1) + " element at " + pos1.img.style.left + "," + pos1.img.style.top  + ", Line endpoint at (x,y) " + pos1.x + ", " + pos1.y + " to<br />" +
        "->Pt " + N + " at       " +     pos2.img.style.left + "," + pos2.img.style.top  + ", Line endpoint at (x,y) " + pos2.x + ", " + pos2.y);
        
        MYSTUFF.drawLine(pos1, pos2,ctx);
        pos1 = pos2;
      }
  }
    function dragHandlers(){
//    Return the object required by jQuery 'draggable()'
      var $target;
      var targetId
      var index;
      var position;
      return{
        start:function(event, ui){
          $target = $(event.target);
          targetId = $(event.target).attr('id');
          index = targetId.split("t")[1];
        },
        drag: function(event, ui){
          position = MYSTUFF.eventXyToChartXy(event);
          wayPoints[index].x = position.x; wayPoints[index].y = position.y;
          connectWaypoints();
          mycode.replaceP("debugOutput",index + ":" + position.x + ", " + position.y + 
                         " Positioned at " + $target.css("top") + ", " + $target.css("left"));
        },
        stop: function(event, ui){
          position = MYSTUFF.eventXyToChartXy(event);
          wayPoints[index].x = position.x; wayPoints[index].y = position.y;
          connectWaypoints();
          mycode.replaceP("debugOutput","Waypt#" +  index + ": " + position.x + ", " + position.y + 
                         " Positioned at " + $target.css("left") + ", " + $target.css("top"));
         }
      };             
  }
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
    MYSTUFF.reportLatLong(event); //function is in waypointMgr2.
  };
  
  MYSTUFF.trackCanvas_mousemove = function(event){
    var el;
    el = event.target;
    console.log("Mouse move detected by element id " + el.id);
    MYSTUFF.reportLatLong(event);
  };
  
  MYSTUFF.trackCanvas_mouseclick = function(event){
  var position;
    if(event.shiftKey){return;}
    if(event.ctrlKey) {return;}
    if(event.altKey)  {return;}
  //No modifier key:
    position = MYSTUFF.eventXyToChartXy(event);
    MYSTUFF.createWaypoint(position);
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