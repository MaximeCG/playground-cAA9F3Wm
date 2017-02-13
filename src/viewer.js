

/*
 * ######################################################### #### #### #### EDIT
 * FROM HERE #### #### ####
 * #########################################################
 */

var lerp = function(a, b, u) {
  return a + (b - a) * u;
};

var unlerp = function(a, b, v) {
  return (v - a) / (b - a);
};

Drawer = function(canvas, width, height) {
  this.max_scale = 70;
  this.benchmark = false;
  this.game_name = "Onboarding";
  this.short_name = "Onboarding";

  this.imagePaths = [ '0.png', '1.png', '2.png', '3.png', '4.png', '5.png',
      '6.png', '7.png', '8.png', '9.png', '10.png', '11.png', '12.png',
      '13.png', '14.png', '15.png', '16.png', '17.png', '18.png',
      '19.png', '20.png', '21.png', '22.png', '23.png', '24.png',
      '25.png', '26.png', 'enemy_debug.png', 'background.jpg',
      'background2.jpg', 'big_canon_canon.png',
      'big_canon_ring_animated.png',
      'big_canon_ring_points.png',
      'big_canon_support.png', 'crosshair.png',
      'crosshair_ring_01.png', 'crosshair_ring_02.png',
      'crosshair_ring_03.png', 'crosshair_ring_04.png',
      'crosshair_ring_05.png', 'debug_mode_activated.png',
      'debug_mode_disabled.png', 'font.fnt', 'hud.png', 'latobitmap.fnt',
      'lose.png', 'radar_canon_ring_animation.png',
      'radar_enemy_head.png', 'spritesheet.png',
      'threat_level_gauge.png', 'win.png' ];

  var base_url = 'https://files.codingame.com/codingame/onboarding-game/';
  // var base_url = 'http://127.0.0.1/localgame/';

  function loadTexturesFromSheet(array, sheet, offsetX, offsetY, w, h, sep, n) {
    for (var i = 0; i < n; i++) {
      var frame = new PIXI.Rectangle(offsetX + (sep * i), offsetY, w, h);
      array.push(new PIXI.Texture(sheet, frame));
    }
  }

  this.resources = {}
  for (var i = 0, l = this.imagePaths.length; i < l; ++i) {
    var fname = this.imagePaths[i];
    var vname = fname.split('.')[0];
    this.resources[vname] = base_url + fname;
  }

  var resources = this.resources;
  var explosionTexture = PIXI.Texture.fromImage(resources.spritesheet);

  var whiteDebrisTextures = [];
  var blackDebrisTextures = [];
  var yellowDebrisTextures = [];

  // Load white debris
  loadTexturesFromSheet(whiteDebrisTextures, explosionTexture, 93, 963, 100,
      60, 25, 10);
  // Load black debris
  loadTexturesFromSheet(blackDebrisTextures, explosionTexture, 75, 1106, 60,
      60, 60, 7);
  // load yellow debris
  loadTexturesFromSheet(yellowDebrisTextures, explosionTexture, 93, 1486,
      100, 60, 25, 10);

  var shipTextures = [];
  for (var i = 0; i <= 26; ++i) {
    shipTextures.push(PIXI.Texture.fromImage(resources[i]));
  }

  this.data = {
    debugMode : false,
    game : {},
    effects : [],
    radarCenter : new PIXI.Point(1963, 540),
    centerRatioX : .664,
    centerRatioY : .50,
    oStartRatioX : .389598109,
    oStartRatioY : .50,
    hudLinesColor : 0x734e19,
    fieldToRadarRatio : 7,
    fieldOffset : {
      x : 50,
      y : 94
    },
    radarOffset : {
      x : 1790,
      y : 480
    },
    threat : 0,
    width : 2115,
    height : 1080,
    renderer : new PIXI.CanvasRenderer(),
    blipTexture : PIXI.Texture.fromImage(resources.radar_enemy_head),
    enemyDebugTexture : PIXI.Texture.fromImage(resources.enemy_debug),
    winTexture : PIXI.Texture.fromImage(resources.win),
    barTexture : PIXI.Texture.fromImage(resources.threat_level_gauge),
    loseTexture : PIXI.Texture.fromImage(resources.lose),

    shipTextures : shipTextures,
    exhaustTextures : [
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(937,
            1122, 25, 25)),
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(1059,
            1127, 13, 14)), ],
    fireTexture : new PIXI.Texture(explosionTexture, new PIXI.Rectangle(
        855, 274, 442, 430)),
    sparkTextures : [
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(100, 844,
            180, 34)),
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(390, 844,
            216, 34)),
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(724, 844,
            198, 34)),
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(1024,
            844, 48, 34)) ],
    enemyDebrisTextures : whiteDebrisTextures.concat(blackDebrisTextures),
    cannonDebrisTextures : yellowDebrisTextures.concat(blackDebrisTextures),
    shockwaveTexture : new PIXI.Texture(explosionTexture,
        new PIXI.Rectangle(127, 127, 594, 594)),
    backBlastTexture : new PIXI.Texture(explosionTexture,
        new PIXI.Rectangle(99, 1257, 227, 132)),
    laserRightCapTexture : new PIXI.Texture(explosionTexture,
        new PIXI.Rectangle(608, 1301, 47, 46)),
    laserMiddleTexture : new PIXI.Texture(explosionTexture,
        new PIXI.Rectangle(754, 1301, 10, 48)),
    overBlastTexture : new PIXI.Texture(explosionTexture,
        new PIXI.Rectangle(860, 1272, 109, 97)),
    chargeTextures : [
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(1076,
            1310, 29, 29)),
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(1205,
            1300, 49, 49)),
        new PIXI.Texture(explosionTexture, new PIXI.Rectangle(1349,
            1295, 60, 58)), ],
    lastProgress : 1,
    lastFrame : -1,
  };

  blackDebrisTextures = null;
  whiteDebrisTextures = null;
  yellowDebrisTextures = null;

  this.question = this.short_name;
  this.currentFrame = -1;
};

/** Mandatory */
Drawer.prototype.parseFrame = function(frame, keyFrame) {
  return frame;
}

/** Mandatory */
Drawer.prototype.getGameName = function() {
  return this.game_name;
};

Drawer.VERSION = 1;

/** Mandatory */
Drawer.prototype.initPreload=function(scope, container, progress, canvasWidth, canvasHeight) {
  scope.canvasWidth=canvasWidth;
  scope.canvasHeight=canvasHeight;
  
  scope.loaderProgress=new PIXI.Text("100", {font:"900 "+(canvasHeight*0.117)+"px Lato", fill:"white", align: "center" });
  container.addChild(scope.loaderProgress);
  scope.loaderProgress.anchor.y=1;
  scope.loaderProgress.anchor.x=1.3;
  scope.progress=scope.realProgress=progress;
  scope.loaderProgress.position.y=canvasHeight;

  scope.progressBar=new PIXI.Graphics();
  container.addChild(scope.progressBar);
};
/** Mandatory */
Drawer.prototype.preload=function(scope, container,  progress, canvasWidth, canvasHeight, obj) {
  scope.progress=progress;
};

/** Mandatory */
Drawer.prototype.renderPreloadScene=function(scope, step) {
  var stepFactor=Math.pow(0.998, step);
  scope.realProgress=stepFactor*scope.realProgress+(1-stepFactor)*scope.progress;
  scope.loaderProgress.setText((scope.realProgress*100).toFixed(0));
  scope.loaderProgress.position.x=scope.realProgress*scope.canvasWidth;
  
  scope.progressBar.clear();
  scope.progressBar.beginFill(0x3f4446, 1);
  scope.progressBar.drawRect(scope.canvasWidth*scope.realProgress, 0, scope.canvasWidth,  scope.canvasHeight);
  scope.progressBar.endFill();
  return true;
};

/* initier la vue par défaut, quand aucun jeu n'est encore lancé */
Drawer.prototype.initDefaultScene = function(scope, container, canvasWidth,
    canvasHeight) {
  var res = this.resources;
  var data = this.data;

  var background = PIXI.Sprite.fromImage(res.background2);
  background.width = canvasWidth;
  background.height = canvasHeight;
  container.addChild(background);

  data.game = new PIXI.DisplayObjectContainer();
  data.effects = [];
  data.ships = [];
  var game = data.game;
  game.scale = new PIXI.Point(canvasWidth / data.width, canvasHeight
      / data.height);

  /*
   * var cannon = new PIXI.DisplayObjectContainer(); cannon.anchor = new
   * PIXI.Point(.5, .5); cannon.base =
   * PIXI.Sprite.fromImage(res.big_canon_support); cannon.barrel =
   * PIXI.Sprite.fromImage(res.big_canon_canon); cannon.base.anchor =
   * new PIXI.Point(.5, .5); cannon.barrel.anchor = new PIXI.Point(.5, .5);
   * cannon.base.scale = new PIXI.Point(.45, .45); cannon.barrel.scale = new
   * PIXI.Point(.45, .45); cannon.position = new PIXI.Point(data.width *
   * data.oStartRatioX, data.height * data.oStartRatioY); if
   * (data.barrelRotation) { cannon.barrel.rotation = data.barrelRotation; }
   * cannon.shots = new PIXI.DisplayObjectContainer(); cannon.charges = new
   * PIXI.DisplayObjectContainer(); cannon.charges.animation = 0;
   * cannon.charges.baseScale = new PIXI.Point(.5, .5); cannon.charges.anchor =
   * new PIXI.Point(.5, .5);
   * 
   * cannon.ring = PIXI.Sprite.fromImage(res.big_canon_ring_animated);
   * cannon.ring.anchor = new PIXI.Point(.5, .5); cannon.recharge = new
   * PIXI.Graphics();
   * 
   * cannon.recharge.lineStyle(1 / game.scale.x, data.hudLinesColor, 0.6);
   * cannon.recharge.drawCircle(0, 0, 90); cannon.recharge.drawCircle(0, 0,
   * 110);
   * 
   * cannon.addChild(cannon.ring); cannon.addChild(cannon.recharge);
   * cannon.addChild(cannon.base); cannon.addChild(cannon.charges);
   * cannon.addChild(cannon.shots); cannon.addChild(cannon.barrel);
   * 
   * for (i = 0; i < 3; i++) { var charge = new
   * PIXI.Sprite(data.chargeTextures[i]); charge.anchor = new PIXI.Point(.5,
   * .5); cannon.charges.addChild(charge); }
   * 
   * var angle = Math.PI / 2 + cannon.barrel.rotation; var chargeOffset = -60;
   * var chargeAlpha = .22; cannon.charges.position = new
   * PIXI.Point(cannon.barrel.position.x + chargeOffset * Math.cos(angle +
   * chargeAlpha), cannon.barrel.position.y + chargeOffset * Math.sin(angle +
   * chargeAlpha)); game.addChild(cannon);
   */
}

/* appelé à chaque rendu de la vue par défaut */
Drawer.prototype.renderDefaultScene = function(scope, step) {
  return false;
}

/* parsing des données d'initialisation */
Drawer.prototype.recordInitData = function(scope, question, viewLines,
    startLine) {
  return startLine;
};

Drawer.prototype.distanceBetween = function(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/*
 * initier la vue du jeu, une fois que les données de la frame 0 soit arrivées
 */
Drawer.prototype.initScene = function(scope, question, container, canvasWidth, canvasHeight) {

  var res = this.resources;
  var data = this.data;

  data.width = 2115;
  data.height = 1080;
  data.game = new PIXI.DisplayObjectContainer();
  data.effects = [];
  data.asyncEffects = [];
  data.ships = [];
  data.lastFrame -= 1;
  data.lastProgress = 1;
  var game = data.game;
  game.scale = new PIXI.Point(canvasWidth / data.width, canvasHeight
      / data.height);

  container.addChild(game);

  var backTexture = new PIXI.RenderTexture(data.width, data.height,
      new PIXI.CanvasRenderer());

  game.background = PIXI.Sprite.fromImage(res.background);
  var background = game.background;
  background.width = data.width;
  background.height = data.height;
  // backTexture.render(background);
  game.addChild(background);

  var cannon = new PIXI.DisplayObjectContainer();
  cannon.anchor = new PIXI.Point(.5, .5);
  cannon.base = PIXI.Sprite.fromImage(res.big_canon_support);
  cannon.barrel = PIXI.Sprite.fromImage(res.big_canon_canon);
  cannon.base.anchor = new PIXI.Point(.5, .5);
  cannon.barrel.anchor = new PIXI.Point(.5, .5);
  cannon.base.scale = new PIXI.Point(.45, .45);
  cannon.barrel.scale = new PIXI.Point(.45, .45);
  cannon.position = new PIXI.Point(data.width * data.centerRatioX,
      data.height * data.centerRatioY);
  if (data.barrelRotation) {
    cannon.barrel.rotation = data.barrelRotation;
  }
  cannon.shots = new PIXI.DisplayObjectContainer();
  cannon.charges = new PIXI.DisplayObjectContainer();
  cannon.charges.animation = 0;
  cannon.charges.baseScale = new PIXI.Point(.5, .5);
  cannon.charges.anchor = new PIXI.Point(.5, .5);

  cannon.ring = PIXI.Sprite.fromImage(res.big_canon_ring_animated);
  cannon.ring.anchor = new PIXI.Point(.5, .5);
  cannon.recharge = new PIXI.Graphics();

  cannon.recharge.lineStyle(1 / game.scale.x, data.hudLinesColor, 0.6);
  // cannon.recharge.lineStyle(2, 0x734e19, 0.6);
  cannon.recharge.drawCircle(0, 0, 90);
  cannon.recharge.drawCircle(0, 0, 110);

  cannon.addChild(cannon.ring);
  cannon.addChild(cannon.recharge);
  cannon.addChild(cannon.base);
  cannon.addChild(cannon.charges);
  cannon.addChild(cannon.shots);
  cannon.addChild(cannon.barrel);

  for (i = 0; i < 3; i++) {
    var charge = new PIXI.Sprite(data.chargeTextures[i]);
    charge.anchor = new PIXI.Point(.5, .5);
    cannon.charges.addChild(charge);
  }

  var angle = Math.PI / 2 + cannon.barrel.rotation;
  var chargeOffset = -60;
  var chargeAlpha = .22;
  cannon.charges.position = new PIXI.Point(cannon.barrel.position.x
      + chargeOffset * Math.cos(angle + chargeAlpha),
      cannon.barrel.position.y + chargeOffset
          * Math.sin(angle + chargeAlpha));

  var hud = new PIXI.DisplayObjectContainer();
  hud.brownStyle = {
    font : 'bold 30px Lato',
    fill : '#d39327'
  };
  hud.whiteStyle = {
    font : 'bold 30px Lato',
    fill : 'white'
  };

  hud.score = new PIXI.BitmapText("0ooo", {
    font : "74px font"
  });
  hud.score.position = new PIXI.Point(1722, 66);

  var small = 19;

  hud.kills = new PIXI.BitmapText('0oooo', {
    font : small + "px font"
  });
  hud.kills.position = new PIXI.Point(1920, 734);

  hud.left = new PIXI.BitmapText('0oooo', {
    font : small + "px font"
  });
  hud.left.position = new PIXI.Point(1920, 308);

  hud.addChild(hud.score);
  hud.addChild(hud.kills);
  hud.addChild(hud.left);
  hud.threat = new PIXI.Text('00', hud.brownStyle);
  hud.debugMode = new PIXI.Text('DEBUG MODE', hud.brownStyle);

  hud.threat.position = new PIXI.Point(1681, 938);
  hud.debugMode.position = new PIXI.Point(1054, 35);

  backTexture.render(PIXI.Sprite.fromImage(res.hud));

  hud.addChild(hud.threat);
  hud.addChild(hud.debugMode);

  hud.ring = PIXI.Sprite.fromImage(res.radar_canon_ring_animation);
  hud.ring.position = new PIXI.Point(1963, 540);
  hud.ring.anchor = new PIXI.Point(.5, .5);
  hud.addChild(hud.ring);
  hud.bars = new PIXI.DisplayObjectContainer();
  hud.bars.value = 0;
  for (i = 0; i < 4; i++) {
    bar = new PIXI.Sprite(data.barTexture);
    bar.position = new PIXI.Point(1771 + i * 54, 1016); // TODO: magic
                              // numbers
    bar.anchor = new PIXI.Point(40 / 120, 98 / 120);
    bar.scale.y = 0.00001;
    hud.bars.addChild(bar);
  }
  hud.addChild(hud.bars);

  game.hud = hud;
  game.cannon = cannon;
  game.enemies = new PIXI.DisplayObjectContainer();

  game.effects = new PIXI.DisplayObjectContainer();
  game.asyncEffects = new PIXI.DisplayObjectContainer();
  game.blips = new PIXI.DisplayObjectContainer();
  game.blasts = new PIXI.DisplayObjectContainer();

  var radarOffset = data.radarOffset;
  var mask = new PIXI.Graphics();
  var x1 = 290;
  var y1 = 60;
  var x2 = 197;
  var y2 = 120;
  var r = 68;
  mask.lineStyle(1 / game.scale.x, 0, 1);
  mask.beginFill();

  mask.moveTo(radarOffset.x + 197, radarOffset.y);
  mask.arcTo(radarOffset.x + x1, radarOffset.y + y1, radarOffset.x + x2,
      radarOffset.y + y2, r);
  mask.lineTo(radarOffset.x + 40, radarOffset.y + 120)

  x1 = 40 - (290 - 197);
  y1 = 60;
  x2 = 40;
  y2 = 0;
  r = 68;

  mask.arcTo(radarOffset.x + x1, radarOffset.y + y1, radarOffset.x + x2,
      radarOffset.y + y2, r);
  mask.endFill();

  game.splashScreen = new PIXI.DisplayObjectContainer();
  game.splashScreen.position = new PIXI.Point(data.width / 2 - 190,
      data.height / 2 + 11);

  game.crosshair = new PIXI.DisplayObjectContainer();
  var crosshair = game.crosshair;
  crosshair.line = new PIXI.Graphics();
  crosshair.lineRadar = new PIXI.Graphics();
  for (var i = 0; i < 5; ++i) {
    var c = PIXI.Sprite.fromImage(res['crosshair_ring_0' + (i + 1)]);
    c.anchor.x = .5;
    c.anchor.y = .5;
    crosshair.addChild(c);
  }
  var bigC = PIXI.Sprite.fromImage(res.crosshair);
  bigC.anchor.x = .5;
  bigC.anchor.y = .5;
  crosshair.addChild(bigC);
  crosshair.position = cannon.position.clone();
  game.blips.mask = mask;
  crosshair.lineRadar.mask = mask;
  var off = PIXI.Texture.fromImage(res.debug_mode_disabled);
  var on = PIXI.Texture.fromImage(res.debug_mode_activated);
  game.debugButton = new PIXI.MovieClip([ off, on ]);
  game.debugButton.position = new PIXI.Point(1332, 54);
  game.debugButton.anchor = new PIXI.Point(.5, .5);
  game.debugButton.interactive = true;
  game.debugButton.buttonMode = true;
  hud.debugMode.interactive = true;
  hud.debugMode.buttonMode = true;
  var self = this;
  game.debugButton.mousedown = function() {
//    scope.freezeTimeout = 2000;
    self.toggleDebugMode();
  };
  hud.debugMode.mousedown = function() {
//    scope.freezeTimeout = 2000;
    self.toggleDebugMode();
  };

  game.addChild(new PIXI.Sprite(backTexture));
  game.addChild(hud);
  game.addChild(mask);
  game.addChild(game.blips);
  game.addChild(cannon);
  game.addChild(game.enemies);
  game.addChild(game.blasts);
  game.addChild(game.effects);
  game.addChild(game.asyncEffects);
  game.addChild(crosshair);
  game.addChild(crosshair.line);
  game.addChild(crosshair.lineRadar);
  game.addChild(game.splashScreen);
  game.addChild(game.debugButton);
  this.setDebugMode(data.debugMode);
}

Drawer.prototype.getOptions = function() {
  var self=this;
   return [
           {
             title : 'DEBUG',
             get : function() {
               return self.data.debugMode;
             },
             set : self.setDebugMode.bind(self),
             values : {'ON': true, 'OFF': false}
           }
           ];
};

Drawer.prototype.toggleDebugMode = function() {
  this.setDebugMode(!this.data.debugMode);
};

Drawer.prototype.setDebugMode = function(debugMode) {
  var data = this.data;
  data.debugMode = debugMode;
  
  if(this.getCurrentState()==='game') {
    
    var game = data.game;
    var hud = data.game.hud;
    var enemies = game.enemies;
    data.effects = [];
    if (game.effects.children.length > 0) {
      game.effects.removeChildren();
    }
    data.asyncEffects = [];
    if (game.asyncEffects.children.length > 0) {
      game.asyncEffects.removeChildren();
    }
    game.background.visible = !debugMode;
    game.cannon.recharge.visible = !debugMode;
    game.cannon.ring.visible = !debugMode;
    game.debugButton.gotoAndStop(debugMode ? 1 : 0);
    hud.debugMode.setStyle(debugMode ? hud.whiteStyle : hud.brownStyle);
    for (i in enemies.children) {
      var e = enemies.getChildAt(i);
      e.sprite.visible = !debugMode;
      e.debug.visible = debugMode;
    }
  }
}

Drawer.prototype.updateEffects = function(delta) {
  var data = this.data;
  var gameEffects = data.game.effects;
  var effects = data.effects;
  if (effects.length === 0) {
    return false;
  }
  var liveEffects = [];
  for (var i = 0, l = effects.length; i < l; i++) {
    var effect = effects[i];
    effect.update(delta);
    if (effect.lifespan > effect.life || effect.lifespan < 0) {
      gameEffects.removeChild(effect.sprite);
      if (effect.destroy) {
        effect.destroy();
      }
    } else {
      liveEffects.push(effect);
    }
  }
  data.effects = liveEffects;
  return true;
};

Drawer.prototype.updateAsyncEffects = function(delta) {
  var data = this.data;
  var gameEffects = data.game.asyncEffects;
  var effects = data.asyncEffects;
  if (effects.length === 0) {
    return false;
  }
  var liveEffects = [];
  for (var i = 0, l = effects.length; i < l; i++) {
    var effect = effects[i];
    effect.update(delta);
    if (effect.lifespan > effect.life || effect.lifespan < 0) {
      gameEffects.removeChild(effect.sprite);
      if (effect.destroy) {
        effect.destroy();
      }
    } else {
      liveEffects.push(effect);
    }
  }
  data.asyncEffects = liveEffects;
};

Drawer.prototype.addEffect = function(effect) {
  var data = this.data;
  if (!data.debugMode) {
    data.effects.push(effect);
    data.game.effects.addChild(effect.sprite);
  }
};

Drawer.prototype.addAsyncEffect = function(effect) {
  var data = this.data;
  if (!data.debugMode) {
    data.asyncEffects.push(effect);
    data.game.asyncEffects.addChild(effect.sprite);
  }
};

Drawer.prototype.generateExplosion = function(x, y) {
  var data = this.data;
  var sparkCount = 100;
  var debrisCount = 15;
  var shockwave = new Shockwave(x, y, data.shockwaveTexture);
  this.addEffect(shockwave)

  for (var i = 0; i < sparkCount; i++) {
    var scale = 0.5 + 0.6 * Math.random();
    var slife = .5 + 2 * Math.random();
    var t = Math.random() * Math.PI * 2;
    var sspeed = 80 + Math.random() * 400;
    var textureIndex = Math
        .floor(Math.random() * data.sparkTextures.length);
    var s = new Particle(x, y, data.sparkTextures[textureIndex], t,
        sspeed / 2, slife, scale / 6, 0, PIXI.blendModes.ADD);
    this.addEffect(s)
  }

  for (var i = 0; i < debrisCount; i++) {
    var rotSpeed = Math.random();
    var scale = 1;
    var t = Math.random() * Math.PI * 2;
    var sspeed = Math.random() * 100;
    var textureIndex = Math.floor(Math.random()
        * data.enemyDebrisTextures.length);
    var s = new Particle(x, y, data.enemyDebrisTextures[textureIndex], t,
        sspeed, 4, scale, rotSpeed);
    this.addEffect(s)
  }
  var fire = new FireEffect(data.fireTexture, x, y);
  this.addEffect(fire)
};

Drawer.prototype.generateAsyncExplosion = function(x, y) {
  var data = this.data;
  var game = data.game;

  data.asyncEffects = [];
  if (game.asyncEffects.children.length > 0) {
    game.asyncEffects.removeChildren();
  }

  var sparkCount = 160;
  var exhaustCount = 100;
  var debrisCount = 30;

  var shockwave = new Shockwave(x, y, data.shockwaveTexture);
  this.addAsyncEffect(shockwave)

  for (var i = 0; i < sparkCount; i++) {
    var scale = 1 + 0.6 * Math.random();
    var slife = .5 + 2 * Math.random();
    var t = Math.random() * Math.PI * 2;
    var sspeed = 80 + Math.random() * 400;
    var textureIndex = Math
        .floor(Math.random() * data.sparkTextures.length);
    var s = new Particle(x, y, data.sparkTextures[textureIndex], t,
        sspeed / 2, slife, scale / 6, 0, PIXI.blendModes.ADD);
    this.addAsyncEffect(s)
  }

  for (var i = 0; i < exhaustCount; i++) {
    var rotSpeed = Math.random();
    var scale = Math.random() * 4+0.001;
    var t = Math.random() * Math.PI * 2;
    var sspeed = Math.random() * 100;
    var textureIndex = Math.floor(Math.random()
        * data.exhaustTextures.length);
    var s = new Particle(x, y, data.exhaustTextures[textureIndex], t,
        sspeed, 4, scale, rotSpeed);
    this.addAsyncEffect(s)
  }

  for (var i = 0; i < debrisCount; i++) {
    var rotSpeed = Math.random();
    var scale = .65;
    var t = Math.random() * Math.PI * 2;
    var sspeed = Math.random() * 100;
    var textureIndex = Math.floor(Math.random()
        * data.cannonDebrisTextures.length);
    var s = new Particle(x, y, data.cannonDebrisTextures[textureIndex], t,
        sspeed, 4, scale, rotSpeed);
    this.addAsyncEffect(s)
  }

  var fire = new FireEffect(data.fireTexture, x, y, .15);
  this.addAsyncEffect(fire)
};

Drawer.prototype.updateScene = function(scope, question, views, frame,
    progress, speed, reason) {
  /** ************************************* */
  /* SYNCHRONOUS */
  /** ************************************* */
  if (reason === "TIMEOUT") {
    progress = 1;
  }
  

//  scope.freezeTimeout = 2000;
  var data = this.data;
  var debugMode = data.debugMode;
  var game = data.game;
  var cannon = game.cannon;
  var lastProgress = data.lastProgress;
  var delta = frame + progress - data.lastFrame - lastProgress;
  var keyDelta = frame - data.lastFrame;
  var exploAngle = 3 * Math.PI / 2;
  var exploOffset = 10;
  var viewLines = views[frame];
  var num = parseInt(viewLines[0]);
  var targeted = parseInt(viewLines[num + 1]);
  var direction = parseInt(viewLines[num + 2]);
  var score = parseInt(viewLines[num + 3]);
  var kv = viewLines[num + 4].split(" ");
  var kills = parseInt(kv[0]);
  // var visible = parseInt(kv[1]);
  var endScaleUp = .2;
  var startFizz = .3;
  var endFizz = .4;
  var rotateBegin = .8;
  var recoilPower = 45;

  if (debugMode) {
    endScaleUp = .2;
    startFizz = 1;
    endFizz = 1.1;
    rotateBegin = 1;
    recoilPower = 0;
  }
  var eps = 0.000001;
  if (delta >= 0 && delta < eps) {
    return;
  }
  
  // Update enemies

  this.updateEffects(delta);
  var enemies = game.enemies;
  var blips = game.blips;

  if (keyDelta !== 0) {
    var oldShips = data.ships;
    data.ships = [];
    for (var i = 1; i <= num; ++i) {
      shipData = viewLines[i].split(' ');
      data.ships.push({
        name : shipData[0],
        spriteIndex : parseInt(shipData[1]),
        dist : parseFloat(shipData[2]),
        prevDist : parseFloat(shipData[3]),
        angle : parseFloat(shipData[4]),
        id : parseInt(shipData[5]),
      });
    }
    if (keyDelta > 0) {
      for (ind in oldShips) {
        var os = oldShips[ind];
        var s = this.getShipById(os.id, data.ships);
        if (!s) {
          if (!os.sprite.removed) {
            enemies.removeChild(os.sprite);
            blips.removeChild(os.sprite.blip);
          }
        } else {
          s.sprite = os.sprite;
        }
      }
    } else {
      if (enemies.children.length > 0)
        enemies.removeChildren();
      if (blips.children.length > 0)
        blips.removeChildren();
    }
  }
  
  
  var cx = game.cannon.x;
  var cy = game.cannon.y;
  var closest = 200;
  for (var i = 0; i < num; ++i) {
    var s = data.ships[i];
    if (!s)
      continue;

    var enemy;
    if (!s.sprite) {
      enemy = new PIXI.DisplayObjectContainer();
      enemy.sprite = new PIXI.Sprite(
          data.shipTextures[(s.spriteIndex % data.shipTextures.length)]);

      var maxWidth = 500;
      var height = 170;

      var debugGraphics = new PIXI.Graphics();

      s.sprite = enemy;
      enemy.sprite.anchor = new PIXI.Point(.6, .60);

      var textSize = 40;
      var xpadding = 8
      var ypadding = 6;
      var boxStroke = 2;
      var textOffset = 24;

      debugGraphics.lineStyle(Math.ceil(1 / game.scale.x), 0xff5816, 1);
      debugGraphics.drawCircle(0, -10, 50);

      debugGraphics.lineStyle(Math.ceil(boxStroke / game.scale.x), 0xffffff, .4);
      debugGraphics.moveTo(0, 0);
      debugGraphics.lineTo(0, 40 + textSize / 2);
//
      enemy.label = new PIXI.BitmapText(s.name, {
        font : 'bold ' + textSize + 'px latobitmap',
        fill : '#000000',
        align : 'left'
      });
      
      debugGraphics.beginFill(0xffffff, .8);
      debugGraphics.drawRect(Math.round(-xpadding - enemy.label.width / 2),
          Math.round(textOffset + textSize - ypadding), Math.round(enemy.label.width
              + xpadding * 2 + boxStroke), Math.round(textSize + ypadding
              + boxStroke));
      debugGraphics.endFill();

      var repr = new PIXI.Sprite(data.enemyDebugTexture);
      var scale = .3;
      repr.alpha = .8;
      repr.scale = new PIXI.Point(scale, scale);
      repr.anchor = new PIXI.Point(.5, .63);

      debugGraphics.addChild(repr);
      debugGraphics.addChild(enemy.label);

      enemy.label.position.x = -enemy.label.width / 2;
      enemy.label.position.y = textOffset + textSize;

      var debugTexture = new PIXI.RenderTexture(Math.ceil(debugGraphics.width), Math.ceil(debugGraphics.height * 2), data.renderer);

      debugTexture.render(debugGraphics, new PIXI.Point(
          debugGraphics.width / 2, debugGraphics.height));

      enemy.debug = new PIXI.Sprite(debugTexture);

      enemy.debug.anchor.x = .5;
      enemy.debug.anchor.y = .5;

      enemy.addChild(enemy.sprite);
      enemy.addChild(enemy.debug);
      enemy.sprite.visible = !debugMode;
      enemy.debug.visible = debugMode;

      enemies.addChild(enemy);
      enemy.blip = new PIXI.Sprite(data.blipTexture);
      var blip = enemy.blip;
      blip.anchor = new PIXI.Point(.5, .5);
      blips.addChild(blip);

    } else {
      enemy = s.sprite;
    }
    var away = 1500;
    var rho = (s.prevDist + (s.dist - s.prevDist) * progress);
    var theta = s.angle * Math.PI / 180;

    if (rho < closest) {
      closest = rho;
    }
    rho *= away / 100;
    enemy.position.x = cx + rho * Math.cos(theta);
    enemy.position.y = cy - rho * Math.sin(theta);
    enemy.sprite.rotation = Math.PI - theta;

    enemy.blip.position.x = (enemy.position.x - data.fieldOffset.x)
        / data.fieldToRadarRatio + data.radarOffset.x;
    enemy.blip.position.y = (enemy.position.y - data.fieldOffset.y)
        / data.fieldToRadarRatio + data.radarOffset.y;
  }

  
  // Update hud

  var hud = game.hud;

  var paddedScore = score.toString();
  var len = Math.max(0, 4 - paddedScore.length);
  for (var i = 0; i < len; i++) {
    paddedScore += 'o';
  }
  hud.score.setText(paddedScore);
  
  // Update threat gauge

  data.threat = Math.max(0, 100 - (closest));

  // Update barrel

  var nextDirection = direction;
  if (frame < views.length - 1) {
    var v = views[frame + 1];
    var n = parseInt(v[0])
    nextDirection = parseInt(v[n + 2]);
  }

  if (!debugMode && progress > rotateBegin) {
    game.cannon.barrel.rotation = Math.PI
        / 2
        - lerp(direction, nextDirection, unlerp(rotateBegin, 1,
            progress)) * Math.PI / 180;
  } else if (debugMode) {
    game.cannon.barrel.rotation = Math.PI / 2 - direction * Math.PI / 180;
  }
  data.barrelRotation = game.cannon.barrel.rotation;
  
  // Update Cannon

  cannon.recharge.clear();
  cannon.recharge.lineStyle(1 / game.scale.x, data.hudLinesColor, 0.6);
  cannon.recharge.drawCircle(0, 0, 90);
  cannon.recharge.drawCircle(0, 0, 110);
  
  cannon.recharge.lineStyle(20, data.hudLinesColor, .4);
  if (frame % 4 === 1) {
    cannon.recharge.arc(0, 0, 100, 0, progress * Math.PI);
  } else if (frame % 4 === 2) {
    cannon.recharge.arc(0, 0, 100, 0, Math.PI + progress * Math.PI);
  } else if (frame % 4 === 3) {
    cannon.recharge.arc(0, 0, 100, progress * Math.PI, 0);
  } else {
    cannon.recharge.arc(0, 0, 100, Math.PI + progress * Math.PI, 0);
  }
  
  var endRecoil = .1;
  var endReturn = .8;

  if (targeted === 1) {
    if (progress <= endRecoil) {
      cannon.barrel.position.y = Math.sin(-Math.PI / 2
          + cannon.barrel.rotation)
          * (-recoilPower * Math.sin(progress) / endRecoil);
      cannon.barrel.position.x = Math.cos(-Math.PI / 2
          + cannon.barrel.rotation)
          * (-recoilPower * Math.sin(progress) / endRecoil);
    } else if (progress <= endReturn) {
      cannon.barrel.position.y = Math.sin(-Math.PI / 2
          + cannon.barrel.rotation)
          * (-recoilPower * (1 - (progress - endRecoil)
              / (endReturn - endRecoil)));
      cannon.barrel.position.x = Math.cos(-Math.PI / 2
          + cannon.barrel.rotation)
          * (-recoilPower * (1 - (progress - endRecoil)
              / (endReturn - endRecoil)));
    } else {
      cannon.barrel.position.y = 0;
      cannon.barrel.position.x = 0;
    }
  }
  
  var angle = Math.PI / 2 + cannon.barrel.rotation;
  var chargeOffset = -60;
  var chargeAlpha = .22;
  cannon.charges.position = new PIXI.Point(cannon.barrel.position.x
      + chargeOffset * Math.cos(angle + chargeAlpha),
      cannon.barrel.position.y + chargeOffset
          * Math.sin(angle + chargeAlpha));
  
  // Update target
  var shots = cannon.shots;
  if (shots.children.length > 0) {
    shots.removeChildren();
  }
  shots.visible = !debugMode;

  if (game.blasts.children.length > 0) {
    game.blasts.removeChildren();
  }
  game.blasts.visible = !debugMode;
  
  if (!debugMode && keyDelta < 0) {
    // var target = data.ships[data.ships.length - 1];
    // if (this.getShipById(target.id, oldShips))
    // enemies.removeChild(target);
    // blips.removeChild(target.blip);
    // data.ships.pop();
  }

  game.crosshair.target = null;
  game.crosshair.blip = null;
  
  if (targeted === 1) {
    var target = data.ships[data.ships.length - 1].sprite;
    var tipOffset = 60;
    var targetOffset = 35;
    var tipAlpha = 0.26 - Math.PI / 2;

    var dist = Math.floor(this.distanceBetween(target.position,cannon.position) - tipOffset - targetOffset);

    if (progress <= endScaleUp) {
      dist = Math.floor(lerp(0, dist, unlerp(0, endScaleUp, progress)));
    }

    dist = Math.max(dist, 10);

    if (lastProgress < endScaleUp) {
      var dustCount = 10;
      var exhaustPoints = [ new PIXI.Point(273, 97),
          new PIXI.Point(53, 54), new PIXI.Point(95, 7) ];
      var orientations = [ -90, 80, 55 ];

      for (var k = 0, l = 3; k < l; ++k) {
        var cx = 136.5;
        var cy = 205;

        var theta = Math.atan2(exhaustPoints[k].y - cy,
            exhaustPoints[k].x - cx);

        var rho = this.distanceBetween({
          x : cx,
          y : cy
        }, exhaustPoints[k]) / 2;
        var x = cannon.x + cannon.barrel.x + rho
            * Math.cos(-Math.PI / 2 + angle + theta);
        var y = cannon.y + cannon.barrel.y + rho
            * Math.sin(-Math.PI / 2 + angle + theta);
        var spread = Math.PI / 8;
        for (var i = 0; i < dustCount; i++) {
          var slife = .25 + .5 * Math.random();
          var dir = (orientations[k] * Math.PI / 180)
              + (-spread / 2 + Math.random() * spread);
          var sspeed = 200 + Math.random() * 300;
          var textureIndex = Math.floor(Math.random() * 2);
          var s = new Particle(x, y,
              data.exhaustTextures[textureIndex], dir,
              sspeed / 2, slife, 1, 0, 0, 0.5);
          this.addEffect(s)
        }
      }
    }
    
    var shotTexture = new PIXI.RenderTexture(dist
        + data.laserRightCapTexture.width,
        data.laserMiddleTexture.height, data.renderer);
    var shotMiddle = new PIXI.TilingSprite(data.laserMiddleTexture, dist,
        data.laserMiddleTexture.height);

    shotRight = new PIXI.Sprite(data.laserRightCapTexture);

    shotTexture.render(shotMiddle);
    shotTexture.render(shotRight, new PIXI.Point(dist, 0));

    var shot = new PIXI.Sprite(shotTexture);
    if (progress <= endScaleUp) {
      shot.scale.y = unlerp(0, endScaleUp, progress);
    } else if (progress <= startFizz) {
      shot.scale.y = 1;
    } else if (progress <= endFizz) {
      shot.scale.y = Math.max(0.01, 1 - unlerp(startFizz, endFizz, progress));
    } else {
      shot.scale.y = 0.00001;
    }
    
    var blasts = game.blasts;
    var blastScale = 0.00001;
    if (progress <= endScaleUp) {
      blastScale = lerp(.2, 1, unlerp(0, endScaleUp, progress));
    } else if (progress <= startFizz) {
      blastScale = 1;
    } else if (progress <= endFizz) {
      blastScale = 1 - unlerp(startFizz, endFizz, progress);
    }
    if(blastScale<=0) blastScale=0.00001;
    var overBlast = new PIXI.Sprite(data.overBlastTexture);
    var backBlast = new PIXI.Sprite(data.backBlastTexture);

    backBlast.rotation = angle;
    overBlast.rotation = angle + Math.PI / 2;

    var blastOffset = -105;
    var overOffset = -80;
    var blastAlpha = .14;
    var overAlpha = .19;
    backBlast.position = new PIXI.Point(cannon.barrel.position.x
        + blastOffset * Math.cos(angle + blastAlpha),
        cannon.barrel.position.y + blastOffset
            * Math.sin(angle + blastAlpha));
    overBlast.position = new PIXI.Point(cannon.position.x
        + cannon.barrel.position.x + overOffset
        * Math.cos(angle + overAlpha), cannon.position.y
        + cannon.barrel.position.y + overOffset
        * Math.sin(angle + overAlpha));
    
    
    backBlast.scale = new PIXI.Point(.5 * blastScale, .5 * blastScale);
    overBlast.scale = new PIXI.Point(.8 * blastScale, .8 * blastScale);
    backBlast.anchor = new PIXI.Point(.5, .5);
    overBlast.anchor = new PIXI.Point(.5, .5);
    
    shots.addChild(backBlast);
    blasts.addChild(overBlast);
    
    shot.position.x += Math.cos(game.cannon.barrel.rotation + tipAlpha)
        * tipOffset;
    shot.position.y += Math.sin(game.cannon.barrel.rotation + tipAlpha)
        * tipOffset;
    shot.anchor = new PIXI.Point(0, .5);
    
    shot.rotation = Math.PI + target.sprite.rotation;
    if (!debugMode)
      shots.addChild(shot);

    var b1 = (progress == startFizz);
    var b2 = lastProgress < startFizz
        && delta >= (startFizz - lastProgress);
    var b3 = lastProgress > startFizz && progress > startFizz
        && keyDelta > 0;

    if (b1 || b2 || b3) {
      var x = target.x + exploOffset * Math.cos(exploAngle);
      var y = target.y + exploOffset * Math.sin(exploAngle);

      this.generateExplosion(x, y);
      if (hud.kills) {
        var paddedKills = kills.toString();
        var len = Math.max(0, 5 - paddedKills.length);
        for (var i = 0; i < len; i++) {
          paddedKills += 'o';
        }
        hud.kills.setText(paddedKills);
      }

      if (!debugMode && !target.removed) {
        enemies.removeChild(target);
        blips.removeChild(target.blip);
        target.removed = true;
      }
    }
  }

  if (progress > startFizz) {
    if (frame < views.length - 1) {
      var v = views[frame + 1];
      var willShoot = parseInt(v[n + 1]);
      if (willShoot) {
        var n = parseInt(v[0])
        var id = parseInt(v[n].split(' ')[5]);
        var s = this.getShipById(id, data.ships);
        if (s) {
          var t = s.sprite;
          game.crosshair.target = new PIXI.Point(t.x + exploOffset
              * Math.cos(exploAngle), t.y + exploOffset
              * Math.sin(exploAngle));
          game.crosshair.blip = t.blip.position.clone();
        }
      }
    }
  } else if (target) {
    var t = target;
    game.crosshair.target = new PIXI.Point(t.x + exploOffset
        * Math.cos(exploAngle), t.y + exploOffset
        * Math.sin(exploAngle));
    game.crosshair.blip = t.blip.position.clone();
  } else {
    game.crosshair.target = cannon.position.clone();
  }

  var splashScreen = game.splashScreen;

  // Update win / lose
  if (splashScreen.children.length > 0) {
    splashScreen.removeChildren();
  }

  if (reason && progress === 1) {
    var endTexture = data.loseTexture;
    data.threat = 100;
    if (reason == 'SAFE') {
      endTexture = data.winTexture;
      data.threat = 0;
      hud.threat.setText('00');
      if (blips.children.length > 0)
        blips.removeChildren();
    } else if (reason == 'DEAD') {
      this.generateAsyncExplosion(cannon.x, cannon.y);
      game.cannon.barrel.visible = debugMode;
      game.cannon.charges.visible = false;
    }

    var splash = new PIXI.Sprite(endTexture);
    splash.anchor = new PIXI.Point(.5, .5);
    splashScreen.addChild(splash);
    var splashLines = new PIXI.Graphics();

    splashLines.clear();
    splashLines.lineStyle(1 / game.scale.x, data.hudLinesColor, 1);
    var yoffset = -10.5;
    var xoffset = 128;
    var spanLeft = 470;
    var spanRight = 442;
    // left line
    splashLines.moveTo(-splashScreen.width / 2 + xoffset, yoffset);
    splashLines.lineTo(-spanLeft - splashScreen.width / 2 + xoffset,
        yoffset);
    // right line
    splashLines.moveTo(splashScreen.width / 2 - xoffset, yoffset);
    splashLines.lineTo(spanRight + splashScreen.width / 2 - xoffset,
        yoffset);
    splash.addChild(splashLines);
  } else {
    cannon.barrel.visible = true;
    cannon.charges.visible = true;
    data.asyncEffects = [];
    if (game.asyncEffects.children.length > 0) {
      game.asyncEffects.removeChildren();
    }
  }

  var visible = 0;

  for (var i = 0, l = data.ships.length; i < l; i++) {
    if (data.ships[i].dist <= 80 && !data.ships[i].sprite.removed) {
      visible++;
    }
  }

  var padded = visible.toString();
  var len = Math.max(0, 5 - padded.length);
  for (var i = 0; i < len; i++) {
    padded += 'o';
  }
  hud.left.setText(padded);

  data.lastProgress = progress;
  data.lastFrame = frame;
}

Drawer.prototype.renderScene = function(scope, question, views, frame,
    progress, speed, reason, step) {
  var render = true;
  
  /** ************************************* */
  /* ASYNCHRONOUS */
  /** ************************************* */
  var data = this.data;
  var game = data.game;
  var debugMode = data.debugMode;
  var enemies = game.enemies;
  var hud = game.hud;
  var charges = game.cannon.charges;
  var crosshair = game.crosshair;

//  scope.freezeTimeout -= step;
//  if (scope.freezeTimeout <= 0) {
//    scope.freezeTimeout = 0;
//    return false;
//  }

  game.cannon.ring.rotation -= 0.01;
  game.hud.ring.rotation -= 0.02;

  crosshairSpeeds = [ 1.2, -0.60, 0.60, -1.2, 1.8 ];

  this.updateAsyncEffects(step / 600);

  for (var i = 0; i < 5; ++i) {
    var c = crosshair.getChildAt(i);
    c.rotation += crosshairSpeeds[i] * step / 1000;
  }

  var a = crosshair.position;
  var b = crosshair.target || game.cannon.position;
  var angle = Math.atan2(b.y - a.y, b.x - a.x);
  var dist = this.distanceBetween(b, a) / 8;
  if (debugMode)
    dist *= 4;

  crosshair.position.x += dist * Math.cos(angle);
  crosshair.position.y += dist * Math.sin(angle);

  crosshair.line.clear();
  crosshair.line.lineStyle(1 / game.scale.x, 0xffffff, .2);

  crosshair.line.moveTo(crosshair.x, crosshair.y);
  crosshair.line.lineTo(game.cannon.x, game.cannon.y - 14);

  var radius = 10;
  a = data.radarCenter;
  b = crosshair.blip || a;

  angle = Math.atan2(a.y - b.y, a.x - b.x);
  crosshair.lineRadar.clear();
  if (reason != 'SAFE') {
    crosshair.lineRadar.lineStyle(1 / game.scale.x, data.hudLinesColor, .6);
    crosshair.lineRadar.drawCircle(b.x, b.y, radius);
    crosshair.lineRadar.moveTo(a.x, a.y);
    crosshair.lineRadar.lineTo(b.x + radius * Math.cos(angle), b.y + radius
        * Math.sin(angle));
  }

  var threatDelta = 2;
  var displayThreat = data.threat;
  if (displayThreat > hud.bars.value) {
    displayThreat = Math.min(displayThreat, hud.bars.value + threatDelta);
  } else if (data.threat < hud.bars.value) {
    displayThreat = Math.max(displayThreat, hud.bars.value - threatDelta);
  }

  hud.bars.value = displayThreat;
  hud.threat.setText('0' + Math.floor((displayThreat) / 25));

  for (var i = 0; i < 4; i++) {
    if (Math.floor((displayThreat) / 25) > 0) {
      hud.bars.getChildAt(i).scale.y = 1;
    } else {
      hud.bars.getChildAt(i).scale.y = Math.max(0.000001, (displayThreat % 25) / 25);
    }
    displayThreat = Math.max(0, displayThreat - 25);
  }

  var pulseTimes = [ 500, 2000, 1000 ];
  var a = charges.animation;
  var bs = 1;
  charges.animation = (a + step) % pulseTimes[1];
  for (var i = 0; i < 3; i++) {
    var phi = pulseTimes[i] / (2 * Math.PI);
    charges.getChildAt(i).scale = new PIXI.Point(
        bs + Math.sin(a / phi) / 2, bs + Math.sin(a / phi) / 2);
  }

  return render;
}

Drawer.prototype.getShipById = function(id, list) {
  for (i in list) {
    var s = list[i];
    if (s.id === id)
      return s;
  }
  return null;
};

var FireEffect = function(img, x, y, scale) {
  this.life = 2.5;
  this.lifespan = 0;
  this.baseScale = scale || .08;
  this.scale = this.baseScale;
  this.sprite = new PIXI.Sprite(img);
  this.sprite.anchor = new PIXI.Point(.5, .5);
  this.sprite.position = new PIXI.Point(x, y);
  this.sprite.scale = new PIXI.Point(this.scale, this.scale);
  this.sprite.rotation = Math.random() * Math.PI * 2;

  this.sprite.blendMode = PIXI.blendModes.ADD;
};

FireEffect.prototype.update = function(delta) {
  this.lifespan += delta;
  var life = this.life;
  var lifespan = this.lifespan;

  this.scale = this.baseScale + 1.5 * Math.cos(this.lifespan / 1.2 + 4.8)

  var alpha = 1;
  if (lifespan > life * .6) {
    var a = life * .6;
    var b = life;
    var u = (lifespan - a) / (b - a);
    alpha = 1 - u;
  }
  this.sprite.alpha = alpha;
  if (this.scale < 0.01) {
    this.scale = 0.01;
  }
  this.sprite.scale.x = this.scale / 1.5;
  this.sprite.scale.y = this.scale / 1.5;

};

var Particle = function(x, y, img, dir, speed, life, scale, rotSpeed,
    blendMode, opacity) {
  this.opacity = opacity || 1;
  this.lifespan = 0;
  this.life = life;
  this.sprite = new PIXI.Sprite(img);
  this.sprite.anchor = new PIXI.Point(.5, .5);
  this.sprite.position = new PIXI.Point(x, y);
  this.sprite.scale = new PIXI.Point(scale, scale);
  this.sprite.rotation = Math.PI - dir;
  this.dir = Math.PI - dir;
  this.speed = speed;
  this.rotSpeed = rotSpeed || 0;
  this.sprite.blendMode = blendMode || 0;
};

Particle.prototype.update = function(delta) {
  var sprite = this.sprite;
  sprite.position.x += Math.cos(this.dir) * this.speed * delta;
  sprite.position.y += Math.sin(this.dir) * this.speed * delta;
  sprite.rotation += this.rotSpeed * delta;
  this.lifespan += delta;
  var life = this.life;
  var lifespan = this.lifespan;
  var alpha = this.opacity;
  if (lifespan > life * .6) {
    var a = life * .6;
    var b = life;
    var u = (lifespan - a) / (b - a);
    alpha = Math.max(0, this.opacity - u);
  }
  sprite.alpha = alpha;
};

var Shockwave = function(x, y, img) {
  this.life = 1.5 + 1;
  this.lifespan = 0;
  this.scale = .0075;
  this.sprite = new PIXI.Sprite(img);
  this.sprite.position = new PIXI.Point(x, y);
  this.sprite.anchor = new PIXI.Point(.5, .5);
  this.sprite.scale = new PIXI.Point(this.scale, this.scale);
  this.img = img;
};

Shockwave.prototype.update = function(delta) {
  this.lifespan += delta;
  if (this.lifespan > 1) {
    this.scale += delta;
  }
  this.sprite.scale = new PIXI.Point(this.scale, this.scale);
  var life = this.life;
  var lifespan = this.lifespan;
  var alpha = 1;
  if (lifespan > life * .6) {
    var a = life * .6;
    var b = life;
    var u = (lifespan - a) / (b - a);
    alpha = 1 - u;
  }
  this.sprite.alpha = alpha;
};

/*
 * ######################################################### #### #### #### EDIT
 * TO HERE #### #### ####
 * #########################################################
 */

Drawer.prototype.getCurrentState = function() {
  if(this.loaded>=1) {
    if(this.currentFrame>=0) {
      return 'game';
    } else {
      return 'startScreen';
    }
  } else {
    return 'loading';
  }
};

Drawer.prototype.enableAsyncRendering=function(enabled) {
  this.asyncRendering=enabled;
  this.asyncRenderingTime=2000;
};

Drawer.prototype.destroy = function() {
  this.destroyed=true;
};

Drawer.prototype.purge=function() {
  this.scope=[];
  if(this.container.children.length>0) {
    this.container.removeChildren();
  }
  this.changed=true;
};

Drawer.prototype.reinitScene=function() {
  if(this.loaded>=1) {
    this.purge();
    this.asyncRenderingTime=2000;
    this.recordInitData(this.scope, this.question, this.initView, 0, this.playerCount);
    this.initScene(this.scope, this.question, this.container, this.initWidth, this.initHeight, this.frames, this.colors, this.playerMapper);
    this.updateScene(this.scope, this.question, this.frames, this.currentFrame, this.progress, this.speed, this.reasons[this.currentFrame]);
    this.changed=true;
  }
};

Drawer.prototype.reinitDefaultScene=function() {
  if(this.loaded>=1) {
    this.purge();
    this.asyncRenderingTime=2000;
    this.initDefaultScene(this.scope, this.container, this.initWidth, this.initHeight);
    this.changed=true;
  }
};

Drawer.prototype.reinitLoadingScene=function() {
  if(this.loaded<1) {
    this.purge();
    this.asyncRenderingTime=2000;
    this.initPreload(this.scope, this.container, this.loaded, this.initWidth, this.initHeight);
  }
};

Drawer.prototype.reinit=function() {
  if(this.loaded>=1) {
    if(this.currentFrame>=0) {
      this.reinitScene();
    } else {
      this.reinitDefaultScene();
    }
  } else {
    this.reinitLoadingScene();
  }
};

Drawer.prototype.animate=function(time) {
  if(!this.lastRenderTime) this.lastRenderTime=time;
  var step=time-this.lastRenderTime;
  if(this.onBeforeRender) this.onBeforeRender();
  this.asyncRenderingTime-=step;
  
  if(this.loaded<1) this.changed|=this.renderPreloadScene(this.scope, step);
  else if(this.changed || this.asyncRendering || this.asyncRenderingTime>0) {
    if(this.currentFrame<0) this.changed|=this.renderDefaultScene(this.scope, step);
    else this.changed|=this.renderScene(this.scope, this.question, this.frames, this.currentFrame, this.progress, this.speed, this.reasons[this.currentFrame], step)
  }
  
  if(this.changed) {
    this.renderer.render(this.stage);
    this.changed=false;
  } else {
    // don't render, but check mouseover event
//    this.stage.updateTransform();
    this.stage.interactionManager.update();
  }
  if(this.onAfterRender) this.onAfterRender();
    var self=this;
    this.lastRenderTime=time;
    if(!this.destroyed) requestAnimationFrame(this.animate.bind(this));
};


Drawer.prototype._recordInitData=function(frame) {
  var startLine=1;
  this.question = frame[startLine++];
  var lineBefore=startLine;
  startLine=this.recordInitData(this.scope, this.question, frame, startLine, this.playerCount);
  this.initView=frame.slice(lineBefore, startLine);
  var header = frame[0].split(" ");
  this.currentFrame=header[1] | 0;
  this.progress=1;
  if (header.length>2) this.reasons[i]=header[2];
  return frame.slice(startLine,-1);
};

Drawer.prototype._initFrames=function(playerCount, frames) {
  var firstFrame=frames[0];
  if(firstFrame[0]=='-1') {
    this.currentFrame=-1;
    return;
  }
  this._frames=frames;
  this.playerCount=playerCount;
  this.reasons=[];
  this.frames=[];
  this.frames.push(this.parseFrame(this._recordInitData(firstFrame), true));
  for(var i=1;i<this._frames.length;++i) {
    var temp=this._frames[i];
    var header = temp[0].split(" ");
    if (header.length>2) this.reasons[i]=header[2];
    this.frames.push(this.parseFrame(temp.slice(1,-1), header[0]=='KEY_FRAME'));
  }
};

Drawer.prototype.initFrames=function(playerCount, frames, playerMapper) {
  if(playerMapper) this.playerMapper=playerMapper;
  this._initFrames(playerCount, frames);
  this.reinit();
};

Drawer.prototype.update=function(currentFrame, progress, speed) {
  if(this.currentFrame>=0) {
    this.asyncRenderingTime=2000;
    this.changed=true;
    this.speed=speed*2;
    this.currentFrame=currentFrame;
    this.progress=progress;
    if(this.loaded>=1) this.updateScene(this.scope, this.question, this.frames, currentFrame, progress, this.speed, this.reasons[this.currentFrame]);
  }
};


/** compatibilité ancien moteur **/
Drawer.prototype.draw = function(view, time, width, height, colors, progress, views, speed) {
  var header = view.split('\n')[0].split(" ");
  var frameNumber=header[1] | 0;
  this.colors=colors;
  if (frameNumber <=0) {
    var _views=[]
    for(var i=0;i<views.length;++i) {
      _views.push(views[i].split("\n"));
    }
    this._initFrames(1, _views);
    if(view!=this.lastView) {
      this.reinit();
      this.lastView=view;
    }
  }
  if(frameNumber>=0) this.update(frameNumber, progress, speed);
};

Drawer.prototype.init = function(canvas, width, height, colors) {
  console.log(this.getGameName() + " drawer init: " + width + "," + height);
  if (!this.playerMapper)
    this.playerMapper = [ 0, 1, 2, 3, 4, 5, 6, 7 ];
  if (colors)
    this.colors = colors;

  this.asyncRendering = true;
  this.asyncRenderingTime = 0;
  this.destroyed = false;

  var self = this;
  this.canvas = canvas;
  this.initWidth = width;
  this.initHeight = height;
  if (this.stage == null) {
    // Initialisation
    this.question = null;
    this.scope = null;
    this.stage = null;
    this.currentFrame = -1;
    this.loaded = 0;
    // Engine instanciation
    this.stage = new PIXI.Stage(0x22252a);
    this.container = new PIXI.DisplayObjectContainer();
    this.stage.addChild(this.container);
    this.renderer = this.createRenderer(width, height);
    var assetsToLoader = [];

    var assetsToLoader = [];
    for ( var key in this.resources) {
      assetsToLoader.push(this.resources[key]);
    }
    loader = new PIXI.AssetLoader(assetsToLoader, "Anonymous");
    var assetCounter = 0;
    self.scope = [];
    self.initPreload(self.scope, self.container, 0, self.initWidth, self.initHeight);
    self.renderer.render(self.stage);
    requestAnimationFrame(self.animate.bind(self));
    loader.onProgress = function(obj) {
      assetCounter++;
      self.preload(self.scope, self.container, assetCounter / assetsToLoader.length, self.initWidth, self.initHeight,
          obj);
      self.renderer.render(self.stage);
    }
    loader.onComplete = function() {
      for ( var key in self.resources) {
        PIXI.Texture.addTextureToCache(PIXI.Texture
            .fromImage(self.resources[key]), key)
      }
      self.loaded = true;
      self.reinit();
      self.changed = true;

      if(self.onloadcallback) {
        self.onloadcallback();
      }
    }
    loader.onError = function(e) {
      console.log(e);
    }
    loader.load();
  } else {
    this.changed = true;
    this.renderer.resize(width, height);
    self.reinit();
  }
};

Drawer.prototype.onload = function(cb) {
  this.onloadcallback = cb;
};

Drawer.prototype.createRenderer=function(width, height) {
  var renderer;
  var firefox=window.navigator.userAgent.indexOf("Firefox") >= 0 || 
    window.navigator.userAgent.indexOf("Trident") >= 0;
  if(firefox){
    renderer=new PIXI.CanvasRenderer(width, height, this.canvas, false, true, true);
  } else {
    renderer=PIXI.autoDetectRecommendedRenderer(width, height, {
      view: this.canvas,
      clearBeforeRender: false,
      preserveDrawingBuffer: false,
      antialias: true
    });
  }
  return renderer;
};
