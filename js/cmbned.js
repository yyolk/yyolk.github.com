
(function(){

var two_pi = Math.PI * 2;

var Canvas = this.Canvas = function(canvas){
	this.canvas = canvas;
	this.ctx = this.canvas.getContext('2d');
	this.ctx.fillStyle = this.ctx.strokeStyle = 'black';

	this.width = this.canvas.width;
	this.height = this.canvas.height;


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
// 		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.fillRect(0, 0, this.width, this.height);

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
		this.ctx.beginPath();
		this.ctx.moveTo(x1.x * this.width, x1.y * this.height);
		this.ctx.lineTo(x2.x * this.width, x2.y * this.height);
		this.ctx.lineTo(x3.x * this.width, x3.y * this.height);
		this.ctx.lineTo(x4.x * this.width, x4.y * this.height);
		this.ctx.fill();
	},
	
	logo: function(x, y){
		//this.ctx.drawImage(this.yolk, x, y);
		YOLK(this.ctx, x, y);
	},
	
	subtext: function(x, y){
		FUNDAMENTALS(this.ctx, x, y);
	}//,	

//  rect by point	
// 	rect: function(p, w){
// 		x = p.x * this.width;
// 		y = p.y * this.height;
// 		this.ctx.fillRect(x, y, w, w);
// 
// 	}
};
	
})();

document.addEvent('domready', function(){
	var canvas = document.getElement('canvas');
	canvas.setProperties({
		width: (this.getSize().x*.5).floor(),
		height: (this.getSize().y*.9).floor()
		});
		
	$('logo').setStyle('margin-left', ((this.getSize().x - canvas.getSize().x)*.5).floor());
		
	
	//var canvas = new Canvas(document.getElement('canvas'));
	canvas = new Canvas(canvas);

	var cloth = new Cloth(canvas),
		inputs = {}, point,
		key_down, mouse_down, mouse;
	
	
	
	var position = function(event){
		return canvas.adjust({
			x: event.page.x,
			y: event.page.y
		});
	};
	
	var setPoint = function(inv_mass){
		if (!point) return;
		if (mouse) {
			point.setCurrent(mouse);
			point.setPrevious(mouse);
		}
		point.inv_mass = inv_mass;
	};
// 	
// 	document.addEvents({
// 		
// 		'mousedown': function(event){
// 			mouse_down = true;
// 			mouse = position(event);
// //			console.log(mouse);
// 			if (!mouse) return;
// 			point = cloth.getClosestPoint(mouse);
// 			setPoint(0);
// 		},
// 		
// 		'mouseup': function(event){
// 			mouse_down = false;
//  			if (mouse) setPoint( key_down ? 0 : 1);
// 			setPoint(0);
// 		},
// 		
// 		'mousemove': function(event){
// 			if (!mouse_down) return;
// 			
// 			mouse = position(event);
// 			setPoint(mouse ? 0 : 1);
// //			setPoint(0);
// 		}
// 	});
// 	
// 	document.getElements('input').each(function(input){
// 		inputs[input.getProperty('id')] = input;
// 	});

	cloth.draw_points = false;
	cloth.draw_constraints = true;
	
	cloth.draw_quads = true;
	cloth.draw_logo = true;
	
// 	setInterval(cloth.update.bind(cloth), 50);
 	setInterval(cloth.update.bind(cloth), 90);
// 	setInterval(cloth.breeze.bind(cloth), 4000);
});

var Cloth = function(canvas){
	
	//var max_points = 7;
	var width = canvas.width,
		height = canvas.height,
// 		max_dim = Math.max(width, height)/2,
// 		min_dim = Math.min(width, height)/2,
		x_offset = 0,
		y_offset = 0,
		spacing, spacing_y;

	
	this.num_iterations = 1;
	this.canvas = canvas;
	this.points = [];
	this.constraints = [];
	this.quads =[];
	
	spacing = (width/9).floor();
	spacing_y = (height/3).floor();
	
	
	var num_x_points = this.num_x_points = (Math.ceil(width/spacing))+1;
// 	var num_x_points = this.num_x_points = spacing;
	var num_y_points = this.num_y_points = (Math.ceil(height/spacing_y))+1;
// 	var num_y_points = this.num_y_points = spacing_y;
	

	var constraint;
	var quad;
	
	for (var i = 0, y = y_offset; i < num_y_points; i++, y += spacing_y){
		this.points[i] = [];
		
		
		for (var j = 0, x = x_offset; j < num_x_points; j++, x += spacing){
			var point = new Point(canvas, x / width, y / height);
			this.points[i][j] = point;
			
			//add a vertical constraint
			if (i > 0){
				constraint = new Constraint(canvas, this.points[i - 1][j], this.points[i][j]);
				this.constraints.push(constraint);
			}
			
			//add a new horizontal constraints
			if (j > 0){
				constraint = new Constraint(canvas, this.points[i][j - 1], this.points[i][j]);
				this.constraints.push(constraint);
			}
			
			//lower left [i-1][j-1], upper left [i-1][j], upper right [i][j], lower right[i][j-1]
			if( (i>0) && (j>0) ){
				quad = new Quad(
					canvas,
					this.points[i - 1][j-1],
					this.points[i-1][j],
					this.points[i][j],
					this.points[i][j-1]);
				this.quads.push(quad);

			}

		}

	
	}


	

	//pin all top points

// 	for (i = 0; i < this.num_x_points; i++){
// 		this.points[0][i].inv_mass = 0;
// 		}
		

// 	
// 	for ( f = 0; f < 20; f++){
// 	
// 	//randomly pick a point
// 		 point = this.points[(Math.random()*this.num_y_points-1).floor()+1][(Math.random()*this.num_x_points).floor()];
// // 	 position = new FastVector(canvas.adjust({
// // 			x: (this.width*Math.random()), 
// // 			y: (this.width*Math.random())
// // 			})
// // 			);
// 	
// 		position = new FastVector(Math.random()*1+.0001, Math.random()*1.2+.01);
// 		if(position){
// 			console.log(position);
// 			point.setCurrent(position);
// 			point.setPrevious(position);
// 			point.inv_mass=0;
// 		}
// 	}
// 	

	//pin all top points

	for (i = 0; i < this.num_x_points; i++){
		this.points[0][i].inv_mass = 0;
		}


	//left & right
// 	for(j=1; j<this.num_y_points; j++){
// 		this.points[j][0].inv_mass=0;
// 		this.points[j][this.num_x_points-1].inv_mass=0;
// 	}
	
//bottom
	for(i=0; i < this.num_x_points; i++){
		this.points[this.num_y_points-1][i].inv_mass=0;
	}

	
// pin corners
// top left
// 	this.points[0][0].x = 0;
// 	this.points[0][0].y = 0;
// 	this.points[0][0].inv_mass=0;
// top right
// 	this.points[0][this.num_x_points-1].x=1;
// 	this.points[0][this.num_x_points-1].y=0;
// 	this.points[0][this.num_x_points-1].inv_mass=0;
// bottom left
// 	this.points[this.num_y_points-1][0].x=0;
// 	this.points[this.num_y_points-1][0].y=1;
// 	this.points[this.num_y_points-1][0].inv_mass=0;
// bottom right
// 	this.points[this.num_y_points-1][this.num_x_points-1].x=1;
// 	this.points[this.num_y_points-1][this.num_x_points-1].y=1;
// 	this.points[this.num_y_points-1][this.num_x_points-1].inv_mass=0;
	
	this.num_constraints = this.constraints.length;
	
	for (i = 0; i < this.num_constraints; i++)
		this.constraints[i].draw();
	
	this.num_quads = this.quads.length;
	

	
};

Cloth.prototype = {
	
	update: function() {
		this.canvas.clear();
		
		var num_x = this.num_x_points,
			num_y = this.num_y_points,
			num_c = this.num_constraints,
			num_i = this.num_iterations,
			num_q = this.num_quads,
			i, j;
			
		//move each point with a pull from gravity
		for (i = 0; i < num_y; i++)
			for (j = 0; j < num_x; j++)
				this.points[i][j].move();

		//make sure all the constraints are satisfied.
		for (j = 0; j < num_i; j++)
			for (i = 0; i < num_c; i++)
				this.constraints[i].satisfy();


		// unneeded?
// 		for (j = 0; i< num_y; i++)
// 			for (i = 0; i < num_q; i++)
// 				this.quads[i].satisfy();

		//draw
		if (this.draw_constraints)
			for (i = 0; i < this.num_constraints; i++)
				this.constraints[i].draw();
		
		if (this.draw_points)
			for (i = 0; i < this.num_y_points; i++)
				for (j = 0; j < this.num_x_points; j++)
					this.points[i][j].draw();
					

		if (this.draw_quads){
			for (i = 0; i < this.num_quads; i++){
 				this.quads[i].setcolor();
				this.quads[i].draw();
					}

		}
		for (t = 0; t<1; t++){
		px = (Math.random()*(this.num_x_points)).floor();
		py = (Math.random()*(this.num_y_points)).floor();
// 		if (px=0) px = 1;
// 		if (py=0) py = 1;
		px = ( px < 1 ) ? 1 : (( px > this.num_x_points-1 ) ? this.num_x_points-2 : px);
		py = ( py < 1 ) ? 1 : (( py > this.num_y_points-2 ) ? this.num_y_points-2 : py);


		point = this.points[py][px];
		
		position = new FastVector(Math.random()*1+.0001, Math.random()*1.2+.01);
		if(position){
			point.setCurrent(position);
			point.setPrevious(position);
			point.inv_mass=0.1;
		}		
		
		}
		if (this.draw_logo){
		
			//45 = max width of "Yolk" / 2 and rounded
			this.canvas.logo(this.canvas.width/2 - 45, (this.canvas.height/6));
			}

// pin corners
// top left
// 	this.points[0][0].x = 0;
// 	this.points[0][0].y = 0;
// 	this.points[0][0].inv_mass=0;
// top right
// 	this.points[0][this.num_x_points-1].x=1;
// 	this.points[0][this.num_x_points-1].y=0;
// 	this.points[0][this.num_x_points-1].inv_mass=0;
// bottom left
// 	this.points[this.num_y_points-1][0].x=0;
// 	this.points[this.num_y_points-1][0].y=1;
// 	this.points[this.num_y_points-1][0].inv_mass=0;
// bottom right
// 	this.points[this.num_y_points-1][this.num_x_points-1].x=1;
// 	this.points[this.num_y_points-1][this.num_x_points-1].y=1;
// 	this.points[this.num_y_points-1][this.num_x_points-1].inv_mass=0;
// 	
	
	},


//original	
// 	getClosestPoint: function(pos) {
// 		var min_dist = 1,
// 			min_point = null,
// 			num_x = this.num_x_points,
// 			num_y = this.num_y_points,
// 			dist, i, j;
// 		
// 		for (i = 0; i < num_y; i++){
// 			for (j = 0; j < num_x; j++){
// 				dist = pos.subtract(this.points[i][j].getCurrent()).length();
// 				
// 				if (dist < min_dist){ 
// 					min_dist = dist;
// 					min_point = this.points[i][j];
// 				}
// 			}
// 		}
// 		
// 		return min_point;
// 	},
	
	getClosestPoint: function(pos) {
		var min_dist = 1,
			min_point = null,
			num_x = this.num_x_points,
			num_y = this.num_y_points,
			dist, i, j;
		
		for (i = 0; i < num_y; i++){
			for (j = 0; j < num_x; j++){
				dist = pos.subtract(this.points[i][j].getCurrent()).length();
				
				if (dist < min_dist){ 
					min_dist = dist;
					min_point = this.points[i][j];
				}
			}
		}
		
		return min_point;
	},
	
	
	toggleConstraints: function(){
		this.draw_constraints = !this.draw_constraints;
	},
	
	togglePoints: function(){
		this.draw_points = !this.draw_points;
	},
	

	
	toggleQuads: function(){
		this.draw_quads = !this.draw_quads;
	},
	
	toggleLogo: function(){
		this.draw_logo = !this.draw_logo;
	},
	
	breeze: function(){	
		var num_x = this.num_x_points,
			num_y = this.num_y_points;		
			for (i = 0; i < num_y; i++)
				for (j = 0; j< num_x; j++)
					this.points[i][j].breeze();
	}
};

var Constraint = function(canvas, p1, p2, rl){
	this.canvas = canvas;
	this.p1 = p1;
	this.p2 = p2;
	this.rest_length = rl || p1.getCurrent().subtract(p2.getCurrent()).length();
	this.squared_rest_length = this.rest_length * this.rest_length;
};

Constraint.prototype = {
	draw: function(){
		this.canvas.line(this.p1.getCurrent(), this.p2.getCurrent());
	},
	
	satisfy: function(){
		var p1 = this.p1.getCurrent();
		var p2 = this.p2.getCurrent();
		var delta = p2.subtract(p1);
		
		var p1_im = this.p1.inv_mass;
		var p2_im = this.p2.inv_mass;
		
		var d = delta.squaredLength();
		
		var diff = (d - this.squared_rest_length) / ((this.squared_rest_length + d) * (p1_im + p2_im));
		
		if (p1_im != 0){
			this.p1.setCurrent(p1.add(delta.multiply(p1_im * diff)));
		}
		
		if (p2_im != 0){
			this.p2.setCurrent( p2.subtract(delta.multiply(p2_im*diff)) );
		}
	}
};

var FastVector  = function(x,y){
	this.x = x;
	this.y = y;
};

FastVector.prototype = {
	
	add: function (B,internal) {
		var nx, ny;
		if (typeof(B)=='number'){
			nx = this.x+B;
			ny = this.y+B;
		}else{
			nx = this.x+B.x;
			ny = this.y+B.y;
		}
		return new FastVector(nx,ny);
	},
	add_: function(B) {
		if (typeof(B)=='number'){
			this.x+=B; this.y+=B;
		}else{
			this.x+=B.x; this.y+=B.y;
		}
		return this;
	},
	dot: function(B) {
		return ((this.x*B.x)+(this.y*B.y));
	},
	length: function() {
		return Math.sqrt((this.x*this.x)+(this.y*this.y));
	},
	multiply: function(B) {
		var nx, ny;
		if (typeof(B)=='number'){
			nx = this.x*B; ny = this.y*B;
		}else{ 
			nx = this.x*B.x; ny = this.y*B.y;
		}
		return new FastVector(nx,ny);
	},
	multiply_: function(B) {
		if (typeof(B)=='number'){
			this.x*=B; this.y*=B;
		}else{
			this.x*=B.x; this.y*=B.y;
		}
		return this;
	},
	squaredLength: function(args) {
		return (this.x*this.x)+(this.y*this.y);
	},
	sum: function(){
		return this.x+this.y;
	},
	subtract: function(B) {
		var nx, ny;
		if (typeof(B) == 'number'){
			nx = this.x-B; ny = this.y-B;
		}else{
			nx = this.x-B.x; ny = this.y-B.y;
		}
		return new FastVector(nx,ny);
	},
	subtract_: function(B) {
		if (typeof(B) == 'number'){
			this.x-=B; this.y-=B;
		}else{
			this.x-=B.x; this.y-=B.y;
		}
		return this;
	},
	toString: function() {
		return "["+this.x+","+this.y+"]";
	}

};

var Point = function(canvas, x, y){
	this.canvas = canvas;
	this.current = this.previous = new FastVector(x, y);
	
	this.mass = this.inv_mass = 1;
	this.wind = new FastVector(.6, .2).multiply(.2 * .2);
	this.force = new FastVector(-.02,0.5).multiply(0.05 * 0.05);
	this.radius = 3;
};

Point.prototype = {
	
	setCurrent: function(p) {
		this.current = p;
	},
	
	setPrevious: function(p) {
		this.previous = p;
	},
	
	getCurrent: function() {
		return this.current;
	},
	
	getPrevious: function() {
		return this.previous;
	},
	
	move: function() {
		if (this.inv_mass!=0){
			var new_pos = this.current.multiply(1.99).subtract(this.previous.multiply(0.99)).add(this.force);
			//new_pos.x = (new_pos.x < -10) ? -10 : ((new_pos.x > 10) ? 10 : new_pos.x);
			new_pos.y = (new_pos.y < 0) ? 0 : ((new_pos.y > 1) ? 1 : new_pos.y);
			this.previous = this.current;
			this.current = new_pos;

		}
	},
		
	breeze: function(){
		
		if (this.inv_mass!=0){
			var new_pos = this.current.multiply(1.99).subtract(this.previous.multiply(0.99)).add(this.wind);

			//new_pos.x = (new_pos.x < -10) ? -10 : ((new_pos.x > 10) ? 10 : new_pos.x);
			new_pos.y = (new_pos.y < 0) ? 0 : ((new_pos.y > 1) ? 1 : new_pos.y);
			this.previous = this.current;
			this.current = new_pos;
			//this.wind = new FastVector(Math.random()*.8, 0).multiply(.2 * .2);
			this.wind = this.wind.multiply(-1, 1+Math.random()*.2);
		}
		
	},
	
	draw: function() {
 		this.canvas.circle(this.current, this.radius);

	}
	
};

var Quad = function(canvas, p1, p2, p3, p4, rl){
	this.canvas = canvas;
	this.p1 = p1;
	this.p2 = p2;
	this.p3 = p3;
	this.p4 = p4;
	this.rest_length = rl || p1.getCurrent().subtract(p2.getCurrent()).length();
	this.squared_rest_length = this.rest_length * this.rest_length;
	this.color = 0;
};

Quad.prototype = {
	draw: function(){

		this.canvas.quad(this.p1.getCurrent(), this.p2.getCurrent(),
						this.p3.getCurrent(), this.p4.getCurrent(), this.color);
	},
	
	satisfy: function(){
		var p1 = this.p1.getCurrent();
		var p2 = this.p2.getCurrent();
		var p3 = this.p3.getCurrent();
		var p4 = this.p4.getCurrent();
		
		var delta = p2.subtract(p1);
//		var delta2 = p4.subtract(p3);
		
		var p1_im = this.p1.inv_mass;
		var p2_im = this.p2.inv_mass;
		var p3_im = this.p3.inv_mass;
		var p4_im = this.p4.inv_mass;
		
		
// 		var d = delta.squaredLength();
// //		var d2 = delta2.squaredLength();
// 		
// 		var diff = (d - this.squared_rest_length) / ((this.squared_rest_length + d) * (p1_im + p2_im));
// // 		var diff2 = (d - this.squared_rest_length) / ((this.squared_rest_length + d) *(p3_im + p4_im));
// 		
// 		if (p1_im != 0){
// 			this.p1.setCurrent(p1.add(delta.multiply(p1_im * diff)));
// 		}
// 		
// 		if (p2_im != 0){
// 			this.p2.setCurrent( p2.subtract(delta.multiply(p2_im*diff)) );
// 		}
		
// 		if (p3_im != 0){
// 			this.p3.setCurrent( p3.subtract(delta2.multiply(p3_im*diff2)) );
// 		}
// 		
// 		if (p4_im != 0){
// 			this.p4.setCurrent( p4.subtract(delta2.multiply(p4_im*diff2)) );
// 		}
	},
	
	setcolor: function(){
// 		var c = Math.random() * 255;
 
		var c =  (this.p2.getPrevious().subtract(this.p2.getCurrent()).x) * 10000 * (255*.01);
		
		
// 		c = c * 800;
// 		c = (c < 1) ? 0 : ((c >1) ? (Math.random()*150+50) : c);

		this.color = c.floor();
	}
};
var YOLK = function(canvas, x, y) {
        var c = canvas;
// 		c.globalCompositeOperation = 'source-atop';
        c.fillStyle = "white";
//         c.strokeStyle = 'black';
		c.save();
		c.translate(x,y);
		
		// c.scale(.5,.5);
		
        c.beginPath();
        
        c.moveTo(79.83, 0);
        c.lineTo(79.83, 46.22);
        c.lineTo(79.83, 48.49);
        c.lineTo(80.05, 48.49);
        c.lineTo(80.32, 46.22);
        c.lineTo(85.19, 0);
        c.lineTo(90.87, 0);
        c.lineTo(85.51, 45.66);
        c.lineTo(91.57, 138.68);
        c.lineTo(85.89, 138.68);
        c.lineTo(81.83, 78.30);
        c.lineTo(81.67, 75.47);
        c.lineTo(81.51, 75.47);
        c.lineTo(81.19, 78.30);
        c.lineTo(79.83, 89.62);
        c.lineTo(79.83, 138.68);
        c.lineTo(73.99, 138.68);
        c.bezierCurveTo(73.99, 95.28, 73.99, 0, 73.99, 0);
        c.lineTo(79.83, 0);
        c.closePath();
        c.fill();
		//c.stroke();
        c.beginPath();
        c.moveTo(8.66, 12.81);
        c.lineTo(8.82, 13.19);
        c.lineTo(8.93, 13.19);
        c.lineTo(9.09, 12.81);
        c.lineTo(12.01, 0);
        c.lineTo(17.75, 0);
        c.lineTo(11.80, 23);
        c.lineTo(11.80, 127.32);
        c.lineTo(11.80, 138.67);
        c.lineTo(5.95, 138.67);
        c.lineTo(5.95, 127.32);
        c.lineTo(5.95, 23);
        c.lineTo(0, 0);
        c.lineTo(5.74, 0);
        c.lineTo(8.66, 12.81);
        c.closePath();
        c.fill();
		//c.stroke();
        c.beginPath();
        c.moveTo(32.80, 138.67);
        c.bezierCurveTo(24.96, 138.67, 25.01, 130.06, 25.01, 130.06);
        c.lineTo(25.01, 25.21);
        c.lineTo(25.01, 8.61);
        c.bezierCurveTo(25.01, 8.61, 24.96, 0, 32.80, 0);
        c.bezierCurveTo(40.65, 0, 40.59, 8.61, 40.59, 8.61);
        c.lineTo(40.59, 24.65);
        c.lineTo(40.59, 130.06);
        c.bezierCurveTo(40.59, 130.06, 40.65, 138.67, 32.80, 138.67);
        c.closePath();
        c.moveTo(32.80, 5.69);
        c.bezierCurveTo(30.75, 5.69, 30.85, 8.61, 30.85, 8.61);
        c.lineTo(30.85, 130.06);
        c.bezierCurveTo(30.85, 130.06, 30.75, 132.98, 32.80, 132.98);
        c.bezierCurveTo(32.80, 132.98, 34.75, 130.06, 34.75, 130.06);
        c.lineTo(34.75, 8.61);
        c.bezierCurveTo(34.75, 8.61, 34.86, 5.69, 32.80, 5.69);
        c.closePath();
        c.fill();
		//c.stroke();
        c.beginPath();
        c.moveTo(52.26, 24.13);
        c.lineTo(52.26, 0);
        c.lineTo(58.10, 0);
        c.lineTo(58.10, 24.05);
        c.lineTo(58.10, 133.22);
        c.lineTo(65.84, 133.22);
        c.lineTo(65.84, 138.67);
        c.lineTo(52.26, 138.67);
        c.lineTo(52.26, 24.13);
        c.closePath();
        c.fill();
		//c.stroke();
        c.restore();
//         c.globalCompositeOperation = 'source-over';
    }