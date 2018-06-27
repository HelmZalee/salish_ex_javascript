    MYSTUFF.showStdCurrents = function(){
//  This GETS and DISPLAYS the LOCATIONS of standard current points.
//  The standard current points remain available in MYSTUFF.stdPoints.
//  MYSTUFF.stdPoints[i][0] contains the Y-coordinate of point i,
//      ~            [i][1] contains the X-coordinate of point i.
//  The normal (x,y) is reversed because of the order of (lat, lon).
     alert("show std currents");
     var MYSTUFF.stdPoints = MYSTUFF.getstdcurrentpoints();
     
     var a = performance.now();
     for (var i = 0; i < stdPoints.length;i++)
      {
       drawArrow(stdPoints[i]);
      }
      var b = performance.now();
      alert('It took ' + (b - a) + ' ms.');
     };

     function drawArrow(yx){
  // draw arrow centered at yx[0], yx[1].
      var x = [-4, 1, 1, 4,  1,  1, -4, -4];
      var y = [ 2, 2, 5, 0, -5, -2, -2,  2];
      var a, b;
      var magnification;
      magnification = 1;
      gCanvas = document.getElementById("myCanvas");
      gContext = gCanvas.getContext("2d");
      gContext.beginPath();
      
      a = x[0]*magnification+yx[1];
      b = y[0]*magnification+yx[0];
 
      gContext.moveTo(a, b);
      for (var i = 1; i < x.length; i++){
      a = x[i]*magnification+yx[1];
      b = y[i]*magnification+yx[0];
        gContext.lineTo(a, b);
       }
      gContext.fillStyle = 'green';
      gContext.fill();
      }