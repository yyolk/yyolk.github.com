
document.addEvent('domready', function(){
	var canvas = new Canvas(document.getElement('canvas')),
		cloth = new Cloth(canvas),
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
	
	document.addEvents({
		
		'mousedown': function(event){
			mouse_down = true;
			mouse = position(event);
			
			if (!mouse) return;
			point = cloth.getClosestPoint(mouse);
			setPoint(0);
		},
		
		'mouseup': function(event){
			mouse_down = false;
			if (mouse) setPoint( key_down ? 0 : 1);
		},
		
		'mousemove': function(event){
			if (!mouse_down) return;
			
			mouse = position(event);
			setPoint(mouse ? 0 : 1);
		}
	});
	
	document.getElements('input').each(function(input){
		inputs[input.getProperty('id')] = input;
	});

	cloth.draw_points = false;
	cloth.draw_constraints = true;
	
	cloth.draw_quads = true;
	cloth.draw_logo = true;
	
	setInterval(cloth.update.bind(cloth), 35);
	setInterval(cloth.breeze.bind(cloth), 10000);
});

var Cloth = function(canvas){
	
	var max_points = 7,
		width = canvas.width,
		height = canvas.height,
// 		max_dim = Math.max(width, height)/2,
// 		min_dim = Math.min(width, height)/2,
		x_offset = 0,
		y_offset = 0,
		spacing = 30, spacing_y = 50;

    max_height = height-50;
	
	this.num_iterations = 2;
	this.canvas = canvas;
	this.points = [];
	this.constraints = [];
	this.quads =[];
	
	
	
	var num_x_points = this.num_x_points = Math.ceil(width/spacing)+4;

	var num_y_points = this.num_y_points = Math.ceil((height/spacing_y))+4;
	

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

	for (i = 0; i < this.num_x_points; i++){
		this.points[0][i].inv_mass = 0;
		}




	

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

		for (j = 0; i< num_y; i++)
			for (i = 0; i < num_q; i++)
				this.quads[i].satisfy();

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
		if (this.draw_logo){
		
			//45 = max width of "Yolk" / 2 and rounded
			this.canvas.logo(this.canvas.width/2 - 45, (this.canvas.height/6));
			}
		
	},
	
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
