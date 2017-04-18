$(document).ready(function(){
var canvas = document.getElementById("canvas"),
    CANVAS_WIDTH = $(canvas).width(),
    CANVAS_HEIGHT = $(canvas).height(),
    ctx = canvas.getContext("2d"),
    FPS = 30,
    cities = [],
    antiMissileBatteries = [],
    enemyWeapons = [],
    missilesfired = [],
    level = 1,
    score = 0;

//city constructor
function City(position){
	this.x = position[0];
	this.y = position[1];
	this.width = 20;
	this.height = 20;
	this.active = true;
	this.draw = function(){
		ctx.fillStyle = "purple";
		ctx.fillRect(this.x-10, this.y, this.width, this.height);
	};
};

// anti missile battery constructor
function AntiMissileBattery(position){
	this.active = true;
	this.missiles = 10;
    this.position = position;
	this.x = position[0];
	this.y = position[1];
	this.width = 20;
    this.height = 25;
	this.missilesPositions = [[-10,10],[-5,10],[0,10],[5,10],[10,10],
	                          [-10,25],[-5,25],[0,25],[5,25],[10,25]];
	//draw missiles in the battery
	this.draw = function(){
		ctx.fillStyle = "blue";
		var x = this.x;
		var y = this.y;
		this.missilesPositions.forEach(function(mPosition){
            var mX = x + mPosition[0];
            var mY = y + mPosition[1];     
            ctx.fillRect(mX,mY,2,12);          
		});  
	};

	this.fire = function(){
		this.missiles--;
		this.missilesPositions.pop();
	};

};

// weapon constructor for enemy weapons and player missiles
function Weapon(target, start, weaponColor, speed){
    this.active = true;
    this.reachTarget = false;
    this.explosionfading = false;
    this.explosionArea;
    this.radius = 0; // exlopsion raduis
    this.target = target;
    this.xStart = start[0];
    this.yStart = start[1];
    this.x = this.xStart;
    this.y = this.yStart;
    //the number of frames needed for missile to reach the target, 
    //the lower the faster
    this.speed = speed;
    this.yVelocity = (target[1] - this.y)/this.speed;
    this.xVelocity = (target[0] - this.x)/this.speed;

    this.update = function(){
        this.x += this.xVelocity;
        this.y += this.yVelocity;
    };

    this.draw = function(){
        ctx.strokeStyle = weaponColor;
        ctx.lineWidth = "2.0";
        ctx.beginPath();
        ctx.moveTo(this.xStart, this.yStart);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    };

    this.explode = function(){     
        if (0 <= this.radius && this.radius <= 30){
            var gradient = ctx.createRadialGradient(this.target[0], this.target[1], this.radius, this.target[0], this.target[1], 0)
            gradient.addColorStop(0,"rgba(255,255,255,0)");
            gradient.addColorStop(0.5,"rgba(255,255,255,1)");
            gradient.addColorStop(1,"rgba(255,255,255,1)");
            this.explosionArea = function(){
                ctx.arc(this.target[0], this.target[1], this.radius, 0, 2*Math.PI);
            };
            ctx.fillStyle = gradient;
            ctx.beginPath();
            this.explosionArea();
            ctx.fill();
            if (this.radius == 30){
                this.explosionfading = true;
            }         
        };

        if (this.explosionfading){
           this.radius -= 2;
        }
        else{
            this.radius += 2;
        }       
    }

};


var collideWithBuilding = function(weapon, building){
    var x = building.x - building.width/2,
        y = building.y,
        width = building.width,
        height = building.height;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+width, y);
    ctx.lineTo(x+width, y+height);
    ctx.closePath();

	/*return building.x-building.width/2 <= weapon.x &&
	       building.x+building.width/2 >= weapon.x &&
	       building.y <= weapon.y;*/
    return ctx.isPointInPath(weapon.x, weapon.y);
};

var collideWithGround = function(weapon){
	/*ctx.beginPath();
    ctx.moveTo(0,450);
    ctx.lineTo(0,425);
    ctx.lineTo(510,425);
    ctx.lineTo(510,450);
    ctx.closePath();*/
    groundPath();
	return ctx.isPointInPath(weapon.x, weapon.y)
};

var inMissileFireball = function(weapon){
    var inFireball = false;
    missilesfired.forEach(function(missile){
        if (missile.radius>0){
            missile.explosionArea();
            if(ctx.isPointInPath(weapon.x, weapon.y)){
                inFireball = true;
            };  
        };    
    });   
    return inFireball;
};

var inEnemyWeaponFireball = function(weapon){
    var inFireball = false;
   enemyWeapons.forEach(function(enemyWeapon){
        if(enemyWeapon.radius>0){
            enemyWeapon.explosionArea();
            if(ctx.isPointInPath(weapon.x, weapon.y)){
                inFireball = true;
            }
        }
    });
    return inFireball;
}

var update = function(){
	enemyWeapons.forEach(function(enemyWeapon){
        if(enemyWeapon.active){      
            enemyWeapon.update(); 
           
            if (inMissileFireball(enemyWeapon) /*||
                inEnemyWeaponFireball(enemyWeapon)*/){
                enemyWeapon.active = false;
                enemyWeapon.reachTarget = true;
                enemyWeapon.target = [enemyWeapon.x, enemyWeapon.y];
            };

            var collideWithTarget = function(){ 
                //var r = $.Deferred();  
                //var done = [];            
                cities.forEach(function(city){
                    if(//enemyWeapon.active &&
                       city.active &&
                       collideWithBuilding(enemyWeapon, city)){
                        enemyWeapon.active = false;
                        enemyWeapon.reachTarget = true;
                        city.active = false;                   
                    }
                
                });

                antiMissileBatteries.forEach(function(battery){
                    if(//enemyWeapon.active &&
                       battery.active &&
                       collideWithBuilding(enemyWeapon, battery)){
                        enemyWeapon.active = false;
                        enemyWeapon.reachTarget = true;
                        battery.active = false;
                        battery.missiles = 0;
                        console.log("hit battery");
                    };
                    //done.push("done");
                   
                });
                 /*console.log(done.length);
                if(done.length === 3){
                    r.resolve();
                    return r;
                }*/
            };

            var hitGround = function(){
                if(enemyWeapon.active && 
                    collideWithGround(enemyWeapon)){
                enemyWeapon.active=false;
                enemyWeapon.reachTarget = true;
                enemyWeapon.target = [enemyWeapon.x, enemyWeapon.y];
                console.log("hitGround");
                };               
            };

            
            collideWithTarget();  
            hitGround();
            //collideWithTarget().done(hitGround);
            
        };    
    });

    //check if battery run out of missiles
    antiMissileBatteries.forEach(function(battery){
        if(battery.missiles == 0){
            battery.active = false;
        }
    });

    //update fired missiles
    missilesfired.forEach(function(missile){	
        if(missile.active){
        	missile.update();
            if (//missile.target[0]-1 <= missile.x &&
                //missile.x <= missile.target[0]+1 &&
                missile.y <= missile.target[1]){
                missile.active = false;
                missile.reachTarget = true;
            };
        };
    });
};


var draw = function(){
	ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	drawBackground();

	// draw active cities
	cities.forEach(function(city){
		if (city.active){
    	    city.draw();
        }       
    });

    //draw active anti missile batteries with missiles left
    antiMissileBatteries.forEach(function(battery){
        if(battery.active){
            battery.draw();
        }
    });

    //draw active weapons path and explosions
    enemyWeapons.forEach(function(enemyWeapon){
    	if(enemyWeapon.active){
    		enemyWeapon.draw();
    	}   	
        else if(enemyWeapon.reachTarget){
            enemyWeapon.explode();
        }
    })

    //draw active fired missiles.path and explostions
    missilesfired.forEach(function(missile){
        if(missile.active){
        	missile.draw();
        }
        else if(missile.reachTarget){
            missile.explode();
        };
    })
    
};

var getClickPosition = function(event){
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    return [x,y];
};

var chooseABattery = function(battery1, battery2, battery3){
    if (battery1.active){
        return battery1;
    }
    else if (battery2.active){
        return battery2;
    }
    else if (battery3.active){
        return battery3;
    }
};

var playerShoot = function(event){
    var target = getClickPosition(event);
    var battery;
    if (0 < target[0] && target[0] <= CANVAS_WIDTH/3){
        battery = chooseABattery(antiMissileBatteries[0],
                                 antiMissileBatteries[1],
                                 antiMissileBatteries[2]);   
    }
    else if (CANVAS_WIDTH/3 < target[0] && target[0]<= CANVAS_WIDTH/2){
        battery = chooseABattery(antiMissileBatteries[1],
                                 antiMissileBatteries[0],
                                 antiMissileBatteries[2]);       
    }
    else if (CANVAS_WIDTH/2 < target[0] && target[0]<= CANVAS_WIDTH*2/3){
        battery = chooseABattery(antiMissileBatteries[1],
                                 antiMissileBatteries[2],
                                 antiMissileBatteries[0]);
    }
    else if (CANVAS_WIDTH*2/3 < target[0] && target[0]< CANVAS_WIDTH){
        battery = chooseABattery(antiMissileBatteries[2],
                                 antiMissileBatteries[1],
                                 antiMissileBatteries[0]);;
    };
    
    if(battery){
        battery.fire();
        missilesfired.push(new Weapon(target, battery.position,"blue", 5));
    };    
};

var rand= function(num){
    return Math.floor(Math.random()*num);
};

//generate enemy weapons' targets
var getTargetPositions = function(){
    //add the 3 batteries into targets
    var enemyTargetPositions = [[30,400],[255,400],[480,400]];
    var activeCities = [];

    //get active city positions
    cities.forEach(function(city){
        if(city.active){
            activeCities.push([city.x, city.y]);
        }
    });

    // Enemy weapons are only able to destroy three cities during one level.
    if(activeCities.length <= 3){
        enemyTargetPositions = enemyTargetPositions.concat(activeCities);
    }
    else{
        for(var i=0; i<3; i++){
            var randIndex = rand(activeCities.length);
            enemyTargetPositions.push(activeCities[randIndex]);
            activeCities.splice(randIndex, 1);
        };      
    };
    return enemyTargetPositions;
};

var initialLevel = function(){
    antiMissileBatteries = [];
    enemyWeapons = [];
    missilesfired = [];

    //create 3 anti missile batteries with 10 missiles
    var batteryPositions = [[30,400],[255,400],[480,400]];
    batteryPositions.forEach(function(position){
        antiMissileBatteries.push(new AntiMissileBattery(position));
    });

    //create 10 enemy weapons
    var enemyTargetPositions = getTargetPositions();
    for (var i=0; i<10; i++){
        var randIndex = rand(enemyTargetPositions.length);
        var target = enemyTargetPositions[randIndex];
        var start = [rand(CANVAS_WIDTH), 0];
        //the number of frames needed for missile to reach the target, 
        //the lower the faster
        var randSpeed = Math.floor(Math.random()*(800/level - 80)+80);
        var speed = randSpeed < 40 ? 40 : randSpeed; 
        enemyWeapons.push(new Weapon(target, start, "red", speed));
    };
    
    //draw background
    drawBackground();

    // draw active cities
    cities.forEach(function(city){
        if (city.active){
            city.draw();
        }        
    });

    //draw anti missile batteries with missiles
    antiMissileBatteries.forEach(function(battery){
        battery.draw();
    });
};

var initialGame = function(){
    cities = [];
    level = 1;
    score = 0;

    //create 6 city-objects
    var cityPositions=[[95,405],[145,405],[195,405],
                       [320,405],[370,405],[420,405]];
    cityPositions.forEach(function(position){
    	cities.push(new City(position));
    });    

    initialLevel();
};

var levelEnd = function(){
    return enemyWeapons.every(function(enemyWeapon){        
           return enemyWeapon.radius < 0;
        });
};

var gameEnd = function(){
    var citiesAllDestroyed = cities.every(function(city){
           return city.active === false;
        });
    var allFireballGone = enemyWeapons.every(function(enemyWeapon){        
           return enemyWeapon.radius < 0;
        });
    return citiesAllDestroyed && allFireballGone;
};

var showLevelEnd = function(){    
    var missileCount = 0;
    var cityCount = 0;
    antiMissileBatteries.forEach(function(battery){
        missileCount += battery.missiles;
    })
    cities.forEach(function(city){
        if(city.active){
            cityCount++;
        }
    });

    score += (cityCount*100 + missileCount*5)*(level > 6 ? 6 : level);
    level++;
    ctx.font = "26px Arial bold";
    ctx.fillStyle = "yellow";
    //ctx.fillText("LEVEL END", 150, 100);
    ctx.fillText("CLICK TO START LEVEL "+ level, 100, 150);
    ctx.fillStyle = "red";
    ctx.fillText("CITIES SAVED: " + cityCount, 150, 200);
    ctx.fillText("MISSILES LEFT: " + missileCount, 150, 250);
    ctx.fillText("SCORE: " + score, 150, 300);
};

var showGameEnd = function(){
    ctx.clearRect(0,0,510,400);
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,510,400);
    ctx.font = "26px Arial bold";
    ctx.fillStyle = "yellow";
    ctx.fillText("GAME END", 150, 150);
    ctx.fillText("CLICK TO RESTART", 150,200);
    ctx.fillStyle = "red";
    ctx.fillText("SCORE: " + score, 150, 250);
    
};

var groundPath = function(){
	ctx.beginPath();
    ctx.moveTo(0,450);
    ctx.lineTo(0,425);
    ctx.lineTo(20,400);
    ctx.lineTo(40,400);
    ctx.lineTo(60,425);
    ctx.lineTo(225,425);
    ctx.lineTo(245,400);
    ctx.lineTo(265,400);
    ctx.lineTo(285,425);
    ctx.lineTo(450,425);
    ctx.lineTo(470,400);
    ctx.lineTo(490,400);
    ctx.lineTo(510,425);
    ctx.lineTo(510,450);
    ctx.closePath();
};

var drawBackground = function(){
    //draw background
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,510,450);

   //draw ground
   ctx.fillStyle = "yellow";
   ctx.lineWidth = 2.0;
   groundPath();
   ctx.fill();
};


//play game
initialGame();
$(canvas).on("click", function(event){
    playerShoot(event)
});

setTimeout(function timer(){
    update();
    draw();
    if(!gameEnd() && !levelEnd()){
        setTimeout(timer, 1000/FPS);//repeat
    }
    else if(gameEnd()){
        $(canvas).off("click");
        showGameEnd();
        $(canvas).one("click", function(){
            initialGame();
            $(canvas).on("click", function(event){
                playerShoot(event)
            });
            setTimeout(timer, 1000/FPS);
        });
    }
    else if(levelEnd()){   
        $(canvas).off("click");       
        showLevelEnd();
        $(canvas).one("click", function(){
            initialLevel();
            $(canvas).on("click", function(event){
                playerShoot(event)
            });
            setTimeout(timer, 1000/FPS);
        });
    };

}, 1000/FPS)


})
