var CURNT = {
//Copied from demoGetCurrents.html
  ETX:-1, 
  currentRoot:undefined,
  
  getCurrentTree:function getCurrentTree(){
    var oReq = new XMLHttpRequest();
    oReq.open("GET", "currentPoints/stdCurrents.bin", true);
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
        CURNT.currentRoot = CURNT.deserialize(currentRecArray);
        }
      };
      oReq.addEventListener("progress",function(oEvent){
        if (oEvent.lengthComputable){CURNT.replaceText("treeStatus",(Math.floor(0.5 + (oEvent.loaded/oEvent.total)*100)) + "% complete");}});
        
      oReq.addEventListener("load",function(oEvent){CURNT.replaceText("treeStatus","Data loaded");});
        
      oReq.addEventListener("error",function(oEvent){CURNT.replaceText("treeStatus","An error occurred");});
        
      oReq.addEventListener("abort",function(oEvent){CURNT.replaceText("treeStatus","loading aborted");});
      
      oReq.send(null);
      CURNT.replaceText("treeStatus","Request for current data sent...");
    },
    
   readLine: function(buffer){
    var line, X, Y, spdHdg, current, nCurrent;
    if (buffer.start >= buffer.byteLength) return CURNT.ETX;
    X = buffer[buffer.start++];
    if (X == 65535) return null;
    Y = buffer[buffer.start++];
    line = new CURNT.node(X,Y,current)
    nCurrent = 0;
    current = [];
    for (nCurrent = 0; nCurrent < 43; nCurrent++){
      current.push(buffer[buffer.start++]);
      }
    return new CURNT.node(X,Y,current);
  },
  
  deserialize:function(oStream) {
    var record;
    var oNode;
    if (oStream.EOF) return null;
    oNode = CURNT.readLine(oStream);
    if (oNode == null) return;
    oNode.leftChild  = CURNT.deserialize(oStream);
    oNode.rightChild = CURNT.deserialize(oStream);
    return oNode;
  },
  
  node: function(X,Y,currents){
//  https://stackoverflow.com/questions/7694501/class-vs-static-method-in-javascript
//  Scroll down to Eduardo Cuomo (and Jaskey, and others)
    this.X = X;
    this.Y = Y;
    this.parent = null;      //parent will be set by traverese().
    this.nextLeft = null;
    this.nextRight = null;
    this.currents = currents;
    CURNT.node.talk = function(){alert("Hi");};
    CURNT.node.lon = function(x){return 125.1932131 - x*0.000815245184958729;};
    CURNT.node.lat = function(y){return 49.4135887961735 - y*0.00053862726962142;};
    CURNT.node.dPxSq = function(x, y, aNode) { var d =
    (x-aNode.X)*(x - aNode.X) + (y - aNode.Y)*(y - aNode.Y);
     return d;};
    CURNT.node.dPx = function(oNode1, oNode2){return Math.sqrt(CURNT.dPxSq(Node1, Node2));};
    },
  
  countNodes: function(){
    var count = CURNT.traverse(CURNT.currentRoot,0);
    CURNT.appendP("loaderDiv", "Node count: " + count);
    },
    
  traverse: function(root, count) {
  // Traverse tree to count nodes.  Invoke with traverse(null, root, count)
    if (root === undefined) return count;
    root.parent = parent;
    count++;
    count = this.traverse(root.leftChild, count);
    count = this.traverse(root.rightChild,count);
    return count;
    },
  
  demoNearestNode: function(){
    var oNearNodes;
    var x = document.getElementById("x_pixel").value;
    var y = document.getElementById("y_pixel").value;
    oNearNodes = CURNT.findNearestNode(x, y);
    CURNT.appendP("searchResult", "Node nearest (" + x + "," + y + ") is at (x,y) = ("
           + oNearNodes.nodes[0].X + ", " + oNearNodes.nodes[0].Y + "), distance " + 
             oNearNodes.minDist[0].toFixed(0) + "px." );
    if (oNearNodes.nodes[1] === undefined){
      CURNT.appendP("searchResult", "No other 'close' nodes were found.");
      } else {
      CURNT.appendP("searchResult", "Additional 'close' node(s) were/was:");
      for (var i = 1; i < oNearNodes.minDist.length && oNearNodes.minDist[i] < 1E29; i++) {
        if (oNearNodes.nodes[i] !== undefined) {
          CURNT.appendP("searchResult",
                        oNearNodes.minDist[i].toFixed(0) + "px at (X,Y) = (" + 
                        oNearNodes.nodes[i].X + ", " + oNearNodes.nodes[i].Y + ")");
          }
        }
      }
    },
    
  findNearestNode: function(x, y) {
  /*
    Kick off a leftfirst/depth first descent. Record "min dist" at first leaf.  Subsequently, at each vertex, compare distance-to-xy.  Then determine whether descending could possibly find a smaller distance.  NOTE the first split (ie, the split at the root) is on Lat, by construction of the serialized file.
  */
    const huge = 1E30;
    var splitOnLat = false;   // Reverse on entry or departure from findNearest.
    var oNearNodes;           // oNearNodes records a list of up to max nodes near (x, y).
                              // oNearNodes.minDist[n]=SQ of n-th min d found. ~.nodes[n] is the node.
    oNearNodes = {nLine:0, x:x, y:y, count:0, max: 5, minDist:[], nodes:[]};
    for (var i = 0; i < oNearNodes.max; i++){
//    The length of this array is held constant.  If it is 5, then I find the five nearest currents.    
      oNearNodes.minDist[i] = huge;
      }
    findNearest(oNearNodes, CURNT.currentRoot, splitOnLat);
    for (var i = 0; i < oNearNodes.minDist.length; i++) {
      oNearNodes.minDist[i] = Math.sqrt(oNearNodes.minDist[i]);
      }
    return oNearNodes;
    
    function findNearest(oNearNodes, vertex, splitOnLat){
    // Traverse till we can go no further, which defines the initial minimum distance.
    // Then back up tree, looking to see if the branch not taken could possibly contain a closer node.
      var d, dx, dy, dSq;
      var goLeft;
      var child;
      splitOnLat = !splitOnLat;  

//    If no min distance has been set, continue to attempt descent:    
      if (oNearNodes.minDist[0] >= huge){
//      Still on initial descent, looking for leaf.  Which way next?
        goLeft = splitOnLat ? oNearNodes.y < vertex.Y : oNearNodes.x < vertex.X;
        if (goLeft) {
          if (vertex.leftChild !== undefined) {
//          Continue looking for first leaf
            findNearest(oNearNodes, vertex.leftChild, splitOnLat);
            }
          } else {
            if (vertex.rightChild !== undefined) {
//          Continue looking for first leaf
              findNearest(oNearNodes, vertex.leftChild, splitOnLat);
              }
            }
          }
//      We're backing out.  Look down untraveled branches as we go.
//      Consider the current node (on the way down, we ignored these non-terminal nodes):
        d = CURNT.node.dPxSq(oNearNodes.x, oNearNodes.y, vertex);
        insertIfMinD(d, vertex, oNearNodes);
        
//      Now, if the last time we went right, consider the left node, and vice-versa:  
        child = goLeft ? vertex.rightChild : vertex.leftChild;
        if (child == undefined) return;
        
        dx =  Math.abs(child.X - oNearNodes.x);         
        dy =  Math.abs(child.Y - oNearNodes.y); 
        d = splitOnLat ? dy : dx;
        dSq = d*d;
//      True dSq = dy2 + dx2.  If this dSq !< minDist, dx2 + dy2 !< minDist & we can ignore...        
        if (dSq < oNearNodes.minDist[oNearNodes.max - 1]) {
//        ...but we cannot ignore, we have to get the actual dx2 + dy2:        
          findNearest(oNearNodes, child, splitOnLat);
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
    },
    
    appendP:function(id, text) {//Append <p>text</p> to element id.
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
    
    replaceText:function(id, text) {//stackoverflow.com/questions/3172166/getting-the-contents-of-an-element-without-its-children
      var el;
      el = document.getElementById(id);
      if (el === null) {
        alert("replaceText: Element id = " + id + " not found.");
        return;
      }
      el.firstChild.nodeValue = text;
    }
  }