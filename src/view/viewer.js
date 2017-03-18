// Pre-loading of images
window.skynetFinalLoader = function() {
  this.imageDir = 'https://files.codingame.com/codingame/skynet2-game/';
  this.imagePaths = ['background.jpg', 'boom_zone.png', 'empty_zone.png', 'virus.png', 'hud.png', 'broken_edge.png', 'number.png', 'boom_zone_lose.png'];

  this.nbLoaded = 0;
  this.loadImages = function(paths, whenLoaded) {
    var imgs = [];
    var imageDir = this.imageDir;
    var skynetFinalLoader = this;
    paths.forEach(function(filename) {
      var img = new Image();
      img.onload = function() {
        for (var i = 0; i < paths.length; i++) {
          if (filename == paths[i]) {
            imgs[i] = img;
            break;
          }
        }
        skynetFinalLoader.nbLoaded++;
        if (skynetFinalLoader.nbLoaded == paths.length) {
          whenLoaded(skynetFinalLoader, imgs);
        } else {
          for (i = 0; i < skynetFinalLoader.globalDrawers.length; i++) {
            skynetFinalLoader.globalDrawers[i].loading();
          }
        }
      };
      img.src = imageDir + filename;
    });
  };

  this.globalDrawers = [];
  this.allImgs = null;

  this.loadImages(this.imagePaths, function(myself, loadedImages) {
    myself.allImgs = loadedImages;
    for (var i = 0; i < myself.globalDrawers.length; i++) {
      myself.globalDrawers[i].init(myself.globalDrawers[i].ctx, myself.globalDrawers[i].initWidth, myself.globalDrawers[i].initHeight);
    }
    if(window.onGameLoadedCallback) {
      window.onGameLoadedCallback();
    }
  });
};
window.skynetFinalLoader = new skynetFinalLoader();
// End - Pre-loading of images

// String functions
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function(str) {
    return this.lastIndexOf(str, 0) === 0;
  };
}
if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function(str) {
    return this.indexOf(str, this.length - str.length) === this.length - str.length;
  };
}

// Game constants
REAL_BACK_W = 2115;
REAL_BACK_H = 1080;

ZONE_IMAGE_SIZE=80;
BROKEN_EDGE_IMAGE_SIZE=30;
MARGIN=120;


BLOCK_IMG_SCALE = 1.6;
TELANIM_IMG_SCALE = 0.4;

GAMEBOX_BORDER_WIDTH = 20;
GAMEBOX_BORDER_HEIGHT = 45;

SKYNETFINAL = "SKYNET-FINAL";


Drawer = function(ctx, width, height) {
  console.log("Drawer instantiated: " + width + "," + height);

  this.debug=false;
  this.initOnce = false;
  this.question = SKYNETFINAL;

  this.lastx = 0;
  this.lasty = 0;
  this.last_frame = -1;

  this.trans = {
    zoomx : 1,
    zoomy : 1,
    scrollZoom : 1,
    scrollX : 0,
    scrollY : 0
  };

  this.skf = {
    labWidth : 20,
    labHeight : 10,
    visualX : 5,
    visualY : 5,
    startX : 1,
    startY : 1,
    controlX : 5,
    controlY : 5,
    energy : 100,
    alarm : 20,
    map : [],
    lastX : 0,
    lastY : 0,
    lastDir : "LEFT"
  };

  this.skfImgs = {
    backgroundImg : null,
boom_zone : null,
empty_zone : null,
virus : null,
hud : null,
broken_edge : null,
number : null,
boom_zone_lose : null
  };
};

Drawer.prototype.getOptions = function() {
  var drawer=this;
  return [
          {
            title: "DEBUG MODE",
            get: function() {
              return drawer.debug;
            },
            set : function(value) {
              drawer.debug=value;
            },
            values : {'ON': true, 'OFF': false}
          }
          ];
};

Drawer.prototype.init = function(ctx, width, height, overSampling) {
  console.log("Drawer init: " + width + "," + height);

  this.overSampling=overSampling;
  this.ctx = ctx;
  this.initWidth = width;
  this.initHeight = height;
  this.realWidth = 0;
  this.realHeight = 0;

  if (skynetFinalLoader.allImgs === null) {
    skynetFinalLoader.globalDrawers.push(this);
    this.loading();
    return;
  }

  if (this.initOnce === false) {
    this.initOnce = true;
    this.prepareSprites();
  }

  this.computeZoom();

  if (this.question == SKYNETFINAL) {
    this.skf_init();
  }
};

Drawer.prototype.loading = function() {
  if (!this.ctx) {
    // Too soon
    return;
  }
  var midw = this.initWidth / 2;
  var midh = this.initHeight / 2 - 20;

  var p = (window.skynetFinalLoader.nbLoaded * 100 / window.skynetFinalLoader.imagePaths.length) | 0;

  this.ctx.fillStyle = "#000000";
  this.ctx.strokeStyle = "#FFFFFF";
  this.ctx.fillRect(0, 0, this.initWidth, this.initHeight);
  this.ctx.fillStyle = "#FFFFFF";
  this.ctx.textAlign = "center";
  this.ctx.font = "40px monospace";
  this.ctx.fillText("Loading... " + p + "%", midw, midh);
};

Drawer.prototype.prepareSprites = function() {
  var img = 0;
  img = this.skf_prepareSprites(img);
};

Drawer.prototype.skf_prepareSprites = function(img) {
var allImgs = skynetFinalLoader.allImgs;
var skfImgs = this.skfImgs;

skfImgs.backgroundImg=allImgs[img++];
skfImgs.boom_zone=allImgs[img++];
skfImgs.empty_zone=allImgs[img++];
skfImgs.virus=allImgs[img++];
skfImgs.hud=allImgs[img++];
skfImgs.broken_edge=allImgs[img++];
skfImgs.number=allImgs[img++];
skfImgs.boom_zone_lose=allImgs[img++];
    return img;
};



function toReal(trans, virtualPos) {
  return {
    x : trans.zoomx * (virtualPos.x + trans.scrollX),
    y : trans.zoomy * (virtualPos.y + trans.scrollY)
  };
}

function toVirtual(trans, canvasPos) {
  return {
    x : (canvasPos.x + trans.scrollX) / trans.zoomx,
    y : (canvasPos.y + trans.scrollY) / trans.zoomy
  };
}

function realToCanvas(drawer, realPos) {
  if (drawer.realWidth == 0) {
    return realPos;
  } else {
    return {
      x : realPos.x * drawer.initWidth / drawer.realWidth,
      y : realPos.y * drawer.initHeight / drawer.realHeight
    };
  }
}

function canvasToReal(drawer, canvasPos) {
  if (drawer.realWidth == 0) {
    return canvasPos;
  } else {
    return {
      x : canvasPos.x * drawer.realWidth / drawer.initWidth,
      y : canvasPos.y * drawer.realHeigh / drawer.initHeight
    };
  }
}

Drawer.prototype.computeZoom = function() {

  var trans = this.trans;
  var width = this.initWidth;
  var height = this.initHeight;

  var rx, ry, zoom;

  if (this.canvas) {
    this.initWidth = this.canvas.width;
    this.initHeight = this.canvas.height;
    this.realWidth = this.canvas.offsetWidth;
    this.realHeight = this.canvas.offsetHeight;
    width = this.initWidth;
    height = this.initHeight;
    rx = this.realWidth / REAL_BACK_W;
    ry = this.realHeight / REAL_BACK_H;
    zoom = rx > ry ? rx : ry;
    /*
     * if (zoom > 1) { zoom = 1; }
     */
    trans.zoomx = width / this.realWidth * zoom;
    trans.zoomy = height / this.realHeight * zoom;
    trans.scrollZoom = zoom;
  } else {
    rx = width / REAL_BACK_W;
    ry = height / REAL_BACK_H;
    zoom = rx > ry ? rx : ry;
    trans.zoomx = zoom;
    trans.zoomy = zoom;
    trans.scrollZoom = zoom;
  }
  trans.scrollX = (trans.zoomx * REAL_BACK_W - width) / 2;
  trans.scrollY = (trans.zoomy * REAL_BACK_H - height) / 2;
};

Drawer.prototype.draw = function(view, time, width, height, colors, progress) {
   //+ height + " c: " + colors + " p: " + progress);

  // Always read frame 0 even if images are not loaded to get correct game
  // information
  var viewLines = view.split('\n');
  var startLine = 0;

  // Line 1: KEY_FRAME X [WIN/LOST REASON]
  var header = viewLines[startLine++].split(" ");
  var key_frame = header[1] | 0;
  if (key_frame == 0) {
    // Line 2: Game params
    this.question = viewLines[startLine++];
    if (this.question == SKYNETFINAL) {
      startLine = this.skf_recordInitData(viewLines, startLine);
    } else {
      console.log("WRONG game: " + this.question);
      return;
    }
  }
  var reason = null;
  if (header.length > 2) {
    reason = header[2];
  }

  // Nothing to draw: out
  if (this.initOnce == false) {
    this.loading();
    return;
  }

  var trans = this.trans;
  if (key_frame == 0) {
    trans.scrollX = (trans.zoomx * REAL_BACK_W - width) / 2;
    trans.scrollY = (trans.zoomy * REAL_BACK_H - height) / 2;
  }

  if (this.question == SKYNETFINAL) {
    this.skf_drawGame(viewLines, startLine, key_frame, progress, reason);
  }

  this.lastProgress = progress;
};

Drawer.prototype.skf_init = function() {
  this.skf_drawBackground();
  this.skf_drawHud(0);
};

Drawer.prototype.skf_recordInitData = function(viewLines, startLine) {
  var skf = this.skf;
  // Line 1: NB_NODES NB_LINKS
  skf.mode=viewLines[startLine++]
  var params = viewLines[startLine++].split(' ');
  skf.nbNodes = params[0] | 0;
  skf.nbLinks = params[1] | 0;
  skf.nodes = new Array(skf.nbNodes);
  skf.links = new Array(skf.nblinks);
  var minX = 100000;
  var maxX = 0;
  var minY = 100000;
  var maxY = 0;
  // NODES
  for (var i = 0, il = skf.nbNodes; i < il; i++) {
    params = viewLines[startLine++].split(' ');
    var x = params[0] | 0;
    var y = params[1] | 0;
    skf.nodes[i] = {
      x : x,
      y : y
    };
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  // LINKS
  for (var i = 0, il = skf.nbLinks; i < il; i++) {
    params = viewLines[startLine++].split(' ');
    var from = params[0] | 0;
    var to = params[1] | 0;
    skf.links[i] = {
      from : from,
      to : to,
      cuttable : true
    };
  }
  // EXITS
  params = viewLines[startLine++].split(' ');
  skf.exits = new Array(params.length);
  for(var i = 0, il = params.length; i < il; i++) {
    skf.exits[i] = params[i] | 0;
  }


  if(skf.mode=="LOCKED") {
    for (var i = 0, il = skf.nbLinks; i < il; i++) {
      skf.links[i].cuttable=false;
      if(skf.exits.indexOf(skf.links[i].from)>=0) {
        skf.links[i].cuttable=true;
      }
      if(skf.exits.indexOf(skf.links[i].to)>=0) {
        skf.links[i].cuttable=true;
      }
    }
  }

  skf.minX = minX;
  skf.maxX = maxX;
  skf.minY = minY;
  skf.maxY = maxY;

  return startLine;
};

Drawer.prototype.skf_drawGame = function(viewLines, startLine, key_frame, progress, reason) {
  console.log(this.debug);
  var i, j, il;

  var ctx = this.ctx;
  var skf = this.skf;

  this.skf_drawBackground();


  if (key_frame == -1) {
    // Input failure: only draw background
    return;
  }

  var params = viewLines[startLine++].split(' ');
  var moves = [];
  for(i = 0, il = params.length; i < il; i++) {
    moves[i] = params[i] | 0;
  }
  var lastMove = moves[moves.length - 1];


  var bLink = viewLines[startLine++];
  if (bLink.length == 0) {
    params = [];
  } else {
    params = bLink.split(' ');
  }
  var lastLink = -1;
  var brokens = [];
  for(i = 0, il = params.length; i < il; i++) {
    brokens[i] = params[i] | 0;
    lastLink = brokens[i];
  }

  var linksLeftCounter=0;
  for(var l = skf.nbLinks; l-->0;) {
    if(skf.links[l].cuttable && brokens.indexOf(l)<0) ++linksLeftCounter;
  }
var hud_width=this.skf_drawHud(linksLeftCounter);
this.skf_drawGrid(10,10,this.initWidth-hud_width,this.initHeight-10);


  var realW = this.initWidth;
  var realH = this.initHeight;
  var fakeW = skf.maxX - skf.minX+MARGIN;
  var fakeH = skf.maxY - skf.minY+MARGIN;
  ctx.save();

  var ratio=Math.min((realW-hud_width) / fakeW, realH / fakeH);
  ctx.scale(ratio, ratio);
  var boxW=ratio*fakeW;
  var boxH=ratio*fakeH;
  ctx.translate(-skf.minX+MARGIN/2+Math.max((realW-hud_width)-boxW,0)/ratio/2, -skf.minY+MARGIN/2+Math.max(realH-boxH,0)/ratio/2);

  ctx.lineWidth = 1.5/ratio*this.overSampling;
for(var l = skf.nbLinks; l-->0;) {
  var link = skf.links[l];
  var from = skf.nodes[link.from];
  var to = skf.nodes[link.to];

  var angle=Math.atan2(from.y-to.y, to.x-from.x);
  from={x : from.x+Math.cos(angle)*ZONE_IMAGE_SIZE/2.3 , y : from.y-Math.sin(angle)*ZONE_IMAGE_SIZE/2.3 };

  to={x : to.x-Math.cos(angle)*ZONE_IMAGE_SIZE/2.3 , y : to.y+Math.sin(angle)*ZONE_IMAGE_SIZE/2.3 };


  ctx.save();
  var b = brokens.indexOf(l);
  if (b == -1) {
    // ok
    color = "#fe5045";
    if(!link.cuttable) {
      color = "#9ea9ff";
    }
  } else if (b == brokens.length - 1) {
    //destroyed last time
    ctx.setLineDash([4,4]);
    color = "#71ffcd";
    ctx.drawImage(this.skfImgs.broken_edge, (from.x+to.x)/2-BROKEN_EDGE_IMAGE_SIZE/2,(from.y+to.y)/2-BROKEN_EDGE_IMAGE_SIZE/2, BROKEN_EDGE_IMAGE_SIZE , BROKEN_EDGE_IMAGE_SIZE);
  } else {
  //destroyed
    ctx.setLineDash([4,4]);
    color = "#71ffcd";
  }
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.shadowBlur = 8*this.overSampling;
  ctx.shadowColor = color;
  ctx.moveTo(from.x, from.y);
  if (b >=0 && b == brokens.length - 1) {
    var temp1={ x : (from.x+to.x)/2-Math.cos(angle)*BROKEN_EDGE_IMAGE_SIZE/2, y: (from.y+to.y)/2+Math.sin(angle)*BROKEN_EDGE_IMAGE_SIZE/2};
    var temp2={ x : (from.x+to.x)/2+Math.cos(angle)*BROKEN_EDGE_IMAGE_SIZE/2, y: (from.y+to.y)/2-Math.sin(angle)*BROKEN_EDGE_IMAGE_SIZE/2};
    ctx.lineTo(temp1.x, temp1.y);
    ctx.moveTo(temp2.x, temp2.y);
  }
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
  }

  for(var n = 0, nl = skf.nbNodes; n < nl; n++) {
    var node = skf.nodes[n];
  ctx.save();
  var exit=skf.exits.indexOf(n) != -1;
  ctx.translate(node.x, node.y);
  if(exit) ctx.rotate(progress*Math.PI/2);
  ctx.drawImage(this.skfImgs.empty_zone, -ZONE_IMAGE_SIZE/2,-ZONE_IMAGE_SIZE/2, ZONE_IMAGE_SIZE , ZONE_IMAGE_SIZE);
  ctx.restore();

  if(this.debug) {
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3*this.overSampling;
    ctx.arc(node.x, node.y, ZONE_IMAGE_SIZE/2.8, 0, 2 * Math.PI, false);
    ctx.stroke();
  }
  if (exit) {
    if(this.debug) {
      ctx.beginPath();
      ctx.fillStyle = "#96e5fe";
      ctx.arc(node.x, node.y, ZONE_IMAGE_SIZE/3.5, 0, 2 * Math.PI, false);
      ctx.fill();
    } else {
      ctx.drawImage(this.skfImgs.boom_zone, node.x-ZONE_IMAGE_SIZE/2, node.y-ZONE_IMAGE_SIZE/2, ZONE_IMAGE_SIZE , ZONE_IMAGE_SIZE);
    }
  }
  }


if(moves.length>=2 && (reason == null || reason == "YouLose" )) {
  var pos=1-((Math.cos(progress*Math.PI)+1)/2);
  var size=ZONE_IMAGE_SIZE*(Math.abs(Math.cos(progress*Math.PI))/4+0.75);
  var lastNode=skf.nodes[moves[moves.length-2]];
  var nextNode=skf.nodes[moves[moves.length-1]];
  var point={
    x :(lastNode.x*(1-pos)+nextNode.x*pos),
    y :(lastNode.y*(1-pos)+nextNode.y*pos)
  }
  if(this.debug) {
    ctx.beginPath();
    ctx.fillStyle = "#fe5045";
    ctx.arc(point.x, point.y, size/3.5, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    if(reason == "YouLose") {
      ctx.globalAlpha=Math.min(1,2*(1-progress));
      ctx.drawImage(this.skfImgs.virus, point.x-size/2,point.y-size/2,size , size);
      ctx.globalAlpha=1-ctx.globalAlpha;
      ctx.drawImage(this.skfImgs.boom_zone_lose, nextNode.x-ZONE_IMAGE_SIZE/2,nextNode.y-ZONE_IMAGE_SIZE/2,ZONE_IMAGE_SIZE , ZONE_IMAGE_SIZE);
      ctx.globalAlpha=1;
    } else {
      ctx.drawImage(this.skfImgs.virus, point.x-size/2,point.y-size/2,size , size);
    }

  }
} else {
  if(this.debug) {
    ctx.beginPath();
    ctx.fillStyle = "#fe5045";
    ctx.arc(skf.nodes[moves[moves.length-1]].x, skf.nodes[moves[moves.length-1]].y, ZONE_IMAGE_SIZE/3.5, 0, 2 * Math.PI, false);
    ctx.fill();
  } else {
    ctx.drawImage(this.skfImgs.virus, skf.nodes[moves[moves.length-1]].x-ZONE_IMAGE_SIZE/2, skf.nodes[moves[moves.length-1]].y-ZONE_IMAGE_SIZE/2, ZONE_IMAGE_SIZE , ZONE_IMAGE_SIZE);
  }
}


if(this.debug) {
  for(var n = 0, nl = skf.nbNodes; n < nl; n++) {
    var node = skf.nodes[n];
    if(skf.exits.indexOf(n) != -1) {
      ctx.fillStyle = '#000000';
    } else {
      ctx.fillStyle = '#dafeff';
    }
    ctx.font = "600 35px Arial";
    ctx.textAlign = "center";
    ctx.fillText(n+"", node.x, node.y+12);

  }
}
  ctx.restore();

  if(reason=="YouWin" || reason=="YouLose") {
    ctx.globalAlpha=0.5;
    ctx.fillStyle = "#192436";
    ctx.fillRect(0,this.initHeight/7,this.initWidth,this.initHeight/7);
    ctx.globalAlpha=1;
    ctx.fillStyle = "#dafeff";
  ctx.font = "600 "+(this.initHeight/7)+"px Arial";
  ctx.textAlign = "center";
  ctx.fillText((reason=="YouWin")?"MISSION COMPLETE":"MISSION FAILED",this.initWidth/2,this.initHeight/3.8);
  }
};

Drawer.prototype.skf_drawHud = function(linksLeft) {
  var ctx = this.ctx;
  var trans = this.trans;
  ctx.save();
var scale=this.initHeight/this.skfImgs.hud.height;
width=this.skfImgs.hud.width*scale;
  ctx.setTransform(scale, 0, 0, scale, this.initWidth-width, 0);
  ctx.drawImage(this.skfImgs.hud, 0, 0);


ctx.fillStyle = '#dafeff';
ctx.font = "900 95px Sans";
ctx.textAlign = "right";
ctx.fillText(linksLeft+"  " , 310, 130);

ctx.globalAlpha = 0.25;
ctx.fillText("0" , 310, 130);
ctx.globalAlpha = 1;

ctx.font = "900 30px Sans";
ctx.textAlign = "Left";
ctx.fillText("Links left" , 310, 160);

  ctx.restore();
return width;
};

Drawer.prototype.skf_drawGrid = function(minX, minY, maxX, maxY) {
  var ctx = this.ctx;
  var trans = this.trans;
  ctx.save();

ctx.beginPath();
ctx.lineWidth = 1*this.overSampling;;
ctx.strokeStyle = "#383c3d";
ctx.moveTo(minX, minY);
ctx.lineTo(maxX, minY);
ctx.lineTo(maxX, maxY);
ctx.lineTo(minX, maxY);
ctx.lineTo(minX, minY);
ctx.stroke();


ctx.beginPath();
ctx.fillStyle = "#212322";
for(var i=1;i<6;++i) {
  var y=minY+(maxY-minY)/6*i;
  ctx.arc(minX, y, 3, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(maxX, y, 3, 0, 2 * Math.PI, false);
}
ctx.fill();


// hozirontal
ctx.beginPath();
ctx.strokeStyle = "#202626";
for(var i=1;i<6;++i) {
  var y=minY+(maxY-minY)/6*i;
  ctx.moveTo(minX, y);
  ctx.lineTo(maxX, y);
}
ctx.stroke();


//vertical
ctx.beginPath();
ctx.setLineDash([1,4]);
ctx.strokeStyle = "#29303a";
for(var i=1;i<10;++i) {
  var x=minX+(maxX-minX)/10*i;
  ctx.moveTo(x, minY);
  ctx.lineTo(x, maxY);
}
ctx.stroke();

  ctx.restore();
return width;
};


Drawer.prototype.skf_drawBackground = function() {
  var ctx = this.ctx;
  var trans = this.trans;
  ctx.save();
  ctx.setTransform(trans.zoomx, 0, 0, trans.zoomy, -trans.scrollX, -trans.scrollY);
  ctx.drawImage(this.skfImgs.backgroundImg, 0, 0);
  ctx.restore();
};

var WIDTH_RATIO = 1300;
var HEIGHT_RATIO = 610;

Drawer.getGameRatio = function() {
  return WIDTH_RATIO / HEIGHT_RATIO;
};
