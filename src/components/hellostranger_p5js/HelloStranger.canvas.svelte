<script>
	import P5Component from './P5Component.svelte';
	import { onMount } from 'svelte';
	
	// Component props
	export let w, h, convos, sortMode, personColor, value, zoomContainerData, quotes, convoState, peopleState, zoomPerson, selectedPersonId, selectedConvoId;
	export let debug = false;
	let all_people = [];
	let zoom = 1;
	let pWidth, pHeight;

	// Define your sketch function
	function sketchFunction(p) {
		p.setup = () => {
			p.createCanvas(w, h);
			let counter = 0;
			Object.keys(convos).forEach(convoId => {
				Object.keys(convos[convoId]).forEach(personId => {
					if (typeof convos[convoId][personId] === 'object') {
						all_people[counter] = new Person(counter, convoId, personId, convos[convoId]);
						counter += 1;
					}
				});
			});
		};
		p.draw = () => {
			p.noSmooth();
			p.background("#28212F");
			p.resizeCanvas(w, h);
			

			zoom = p.lerp(zoom, zoomContainerData.scale, 0.1);
			p.push();
			p.translate(w/2 + zoomContainerData.x, h/2 + zoomContainerData.y);
			p.scale(zoom);
			for (let i = 0; i < all_people.length; i++) {
				all_people[i].calculate();
				all_people[i].update();
				all_people[i].display();
			}
			p.pop()
		};


		class Person {
			constructor(n, convoId, personId, data) {
				this.n = n;
				this.convoId = convoId;
				this.personId = personId;
				this.loc = new p.createVector(w/2, h/2);
				this.target_loc = new p.createVector(w/2, h/2);
				this.acc = new p.createVector(0,0);
				this.vel = new p.createVector(0,0);
				this.data = data;
				this.convoState = convoState[convoId];
				this.peopleState = peopleState[personId];
			}

			calculate() {
				this.convoState = convoState[this.convoId];
				this.peopleState = peopleState[this.personId];
				if (sortMode == "person") {
					this.target_loc = new p.createVector(this.peopleState.x, this.peopleState.y)
				} else {
					this.target_loc = new p.createVector(this.convoState.x, this.convoState.y)
				}
			}

			seek() {
			    // Calculate desired velocity
				let desired = this.target_loc.copy().sub(this.loc);
				this.distance = desired.mag();
				desired.normalize();

				let speed = 10;
				// if (this.distance < 100) {
			   //      // Smoother deceleration as the Person approaches the target
				// 	speed = p.map(this.distance, 0, 100, 0, this.topSpeed);
				// } else {
			   //      // Outside the deceleration zone, use max speed
				// 	speed = this.topSpeed;
				// }

				desired.mult(speed);

			    // Gradually adjust the current velocity towards the desired velocity
				this.vel.lerp(desired, 0.2);


			    // If very close to the target, stop more smoothly
				if (this.distance < 4) {
			        this.vel.mult(0.5); // Slow down gradually
			     } else {
			     	this.acc.x += p.random(-0.05, 0.05);
			     	this.acc.y += p.random(-0.05, 0.05);	
			     }

			    // Apply accumulated forces from collision and wiggle
			     this.vel.add(this.acc);
			  }


			  update() {
			  	this.vel.add(this.acc);
			  	this.vel.limit(this.topSpeed);
			  	this.loc.add(this.vel);
			  	this.acc.mult(0);
			  }

			  display() {

				// if (prefersReducedMotion) {
				// 	this.loc = this.target_loc;
				// }

				// const spriteIndex = Math.floor(this.frameCount) % 8;
				p.push(); // Save the current drawing state

				// Move to the sprite's center location
				p.translate(this.loc.x - w/2, this.loc.y - h/2);

				// Adjust for the sprite's width and height
				// const imgX = -(pWidth * this.personWeight) / 2;
				// const imgY = -(pHeight * this.personHeight) / 2;
				// let imageCode = [];
				p.fill(255);
				p.rect(0,0, 20, 20);

				// if (this.distance < 4 && (this.vel.x + this.vel.y) < 1 || prefersReducedMotion) {
				// 	this.frameCount = this.frameCount + 0.1;
				// 	imageCode = [this.gender,"stand"];
				// } else if (this.vel.y > 0 && this.vel.y > Math.abs(this.vel.x)) {
				// 	this.frameCount = this.frameCount + Math.max(minAnimationFrames, Math.abs(this.vel.x/8) + Math.abs(this.vel.y/8));
				// 	imageCode = [this.gender,"down"];
				// } else if (this.vel.y < 0 && this.vel.y > Math.abs(this.vel.x)) {
				// 	this.frameCount = this.frameCount + Math.max(minAnimationFrames, Math.abs(this.vel.x/8) + Math.abs(this.vel.y/8));
				// 	imageCode = [this.gender,"up"];
				// } else {
				// 	this.frameCount = this.frameCount + Math.max(minAnimationFrames, Math.abs(this.vel.x/10) + Math.abs(this.vel.y/10));
				// 	if (this.vel.x < 0) {
				// 		imageCode = [this.gender,"left"];
				// 	} else {
				// 		imageCode = [this.gender,"right"];
				// 	}
				// }

				// if (this.n == firstPerson && currentStage != 0) {
				// 	p.fill(255);
				// 	p.textAlign(p.CENTER, p.BOTTOM);
				// 	const alexWidth = pWidth * this.personWeight;
				// 	if (zoom > 3) {
				// 		// p.text("Alex", imgX, imgY - 6, pWidth * this.personWeight);
				// 		p.triangle(imgX + alexWidth/2, imgY, imgX + alexWidth * .25, imgY - 5, imgX + alexWidth * .75, imgY - 5);
				// 	} else {
				// 		p.stroke("#000000");
				// 		p.strokeWeight(2);
				// 		p.triangle(imgX + alexWidth/2 + 1, imgY, imgX + alexWidth * .25, imgY - 7, imgX + alexWidth * .75 + 1, imgY - 7);
				// 	}
				// }
				// if (clickedPerson != null) {
				// 	if(this.n != clickedPerson) {
				// 		p.tint(255, 50);	
				// 	}
				// }
				// try {
				// 	p.image(sprites[this.race + "-" + this.fill][imageCode.join("-")][spriteIndex], imgX, imgY, pWidth * this.personWeight, pHeight * this.personHeight);	
				// } catch {
				// 	p.image(sprites[this.race + "-nodata"][imageCode.join("-")][spriteIndex], imgX, imgY, pWidth * this.personWeight, pHeight * this.personHeight);	
				// }

			    p.pop(); // Restore the previous drawing state
			 }
			}

			return p;
		}
	</script>
	<svelte:options runes={false} />
<!-- Use our custom P5 component -->
<P5Component
sketch={sketchFunction}
width={w}
height={h}
{debug}
/>