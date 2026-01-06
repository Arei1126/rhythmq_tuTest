`use strict`
import {ScoreDrawer} from "./scoreDrawer2.js"
import {InputManager} from "./inputManagerKey.js"
import {SoundEffectManager} from "./effectSoundManager.js"

import { scoreData} from "./scoreData.js"

const NA = -1;
const YES = 1;
const NO = 0


window.addEventListener("load", async ()=>{
	const scoreCanvas = document.querySelector("#scoreCanvas");
	const Signal = document.createElement("div");


	function main(){
		document.removeEventListener("pointerdown", main);
		const audioCtx = new AudioContext();
		const config = {"timeAdvence": 500}
		const scoreDrawer = new ScoreDrawer(Signal,audioCtx, scoreCanvas, scoreData);
		const inputManagaer = new InputManager(Signal);

		const soundEffectManager = new SoundEffectManager(Signal);
		
		Signal.addEventListener("input", (e)=>{
			const i = e.detail.index;
			scoreDrawer.input(i);
		});

		function update(){
			scoreDrawer.update();
			window.requestAnimationFrame(update);
		}
		
		window.requestAnimationFrame(update);


	}


	document.addEventListener("pointerdown", main);


});
