export class InputManager{
	constructor(Signal){
		this.Signal = Signal;
		document.addEventListener("keydown", (e)=>{
			const key = e.key;
			const index = parseInt(key,10)
			if(index == NaN){
				return;
			}
			const ev = new CustomEvent("input",{
				detail: {
					"index": index-1
				}
			});

			this.Signal.dispatchEvent(ev);
		});
	};

	update(){
	};
}
