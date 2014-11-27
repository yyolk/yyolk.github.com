
// (function(){

var two_pi = Math.PI * 2;

// var Canvas = this.Canvas = function(canvas){
var Canvas = this.Canvas = function(canvas){
	this.canvas = canvas;
	this.YOLK = new YOLK(this.canvas)
	this.ctx = this.canvas.getContext('2d');
	this.ctx.fillStyle = this.ctx.strokeStyle = 'black';

	// --------------------------------------------------
	this.width = this.canvas.width;
	this.height = this.canvas.height;
	//-------------------------------------------------- 
    // this.width = Math.floor((this.canvas.width/3)*2);
    // this.height = this.canvas.height;

};

Canvas.prototype={
	adjust: function(pos) {
		var location = this.canvas.getPosition(),
			lx = location.x,
			ly = location.y,
			px = pos.x,
			py = pos.y;
		
		var inside = (px > lx && px < lx + this.width && py > ly && py < ly + this.height);
		
		return inside ? new FastVector((pos.x - lx) / this.canvas.width, (pos.y - ly) / this.canvas.height) : null;
	},
	
	clear: function(){
		this.ctx.fillStyle  = "black";
// 		this.ctx.fillStyle = "rgb(" + (Math.random()*255).floor() + ',' + (Math.random()*255).floor() + ',' + (Math.random()*255).floor() + ')';
// 		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	},
	
	circle: function(p, r){
		x = p.x * this.width;
		y = p.y * this.height;
		this.ctx.beginPath();
		this.ctx.moveTo(x + r, y);
		this.ctx.arc(x, y, r, 0, two_pi, false);
		this.ctx.fill();
	},
	
	line: function(x1, x2){
		this.ctx.beginPath();
		this.ctx.lineWidth = 5;
		this.ctx.strokeStyle = 'white';
		this.ctx.moveTo(x1.x * this.width, x1.y * this.height);
		this.ctx.lineTo(x2.x * this.width, x2.y * this.height);
		this.ctx.stroke();
	},

	quad: function(x1, x2, x3, x4, color){

		this.ctx.fillStyle = 'rgb(' + color + ',' + color + ',' + color + ')';
		// this.ctx.fillStyle = 'rgba(' + color + ',' + color + ',' + color + ',' + 0.9 + ')';
		this.ctx.beginPath();
		this.ctx.moveTo(x1.x * this.width, x1.y * this.height);
		this.ctx.lineTo(x2.x * this.width, x2.y * this.height);
		this.ctx.lineTo(x3.x * this.width, x3.y * this.height);
		this.ctx.lineTo(x4.x * this.width, x4.y * this.height);
		this.ctx.fill();
	},
	
	logo: function(x, y){
		//this.ctx.drawImage(this.yolk, x, y);
		// YOLK(this.ctx, x, y);
		this.YOLK.draw(x, y);
	},
	
	subtext: function(x, y){
		FUNDAMENTALS(this.ctx, x, y);
	},
		
	refigure: function(){
	
		this.canvas.setProperties({
			//--------------------------------------------------
			// width: (window.getSize().x*.5).floor(),
			// height: (window.getSize().y*.9).floor()
			//-------------------------------------------------- 

			width: (window.getSize().x).floor(),
			height: (window.getSize().y).floor()


			});
		
	// $('logo').setStyle('margin-left', ((window.getSize().x - this.canvas.getSize().x)*.5).floor());
	// this.width = canvas.width;
	// this.height = canvas.height;
	// this.adjust(
	// 	{
	// 		x: Math.floor(window.getSize().x * .5), 
	// 		y: Math.floor(window.getSize().y * .5)
	// 	}
	// );

	}


};
	
// })();
