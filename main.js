let canvas = document.getElementById('canvas');
let ctx = canvas.getContext("2d");

const WIDTH = 600;
const HEIGHT = 600;
const BOARD_WIDTH = 60;
const BOARD_HEIGHT = 60;
const JUMP_SIZE = 10;
const GRAVITY = 2.5;
const PLAYER_SIZE = 10;
const PIN_SIZE = 5;
const SURVIVORS = 30;
const MIX_SURVIVORS = 15;
const POPULATION = 100;
const MUTATION_RATE = 0.7;
class Board
{
    constructor(i,j)
    {
        this.x = BOARD_WIDTH * j;
        this.y = BOARD_WIDTH * i;
        this.player = new Player(this.x, this.y);
        this.pin = new Pin(this.x, this.y);
        this.reset();
    }

    draw()
    {
        if(this.player.isAlive)
        {
            this.pin.move();
            this.pin.draw();
            this.player.think(this.pin);
            this.player.move();

            if(this.player.collission(this.pin))
            {
                this.player.isAlive = false;
            }
            else
            {
                this.player.draw();
            }
        }
        else
        {
            this.gameOver = true;
        }
    }

    reset()
    {
        this.pin = new Pin(this.x, this.y);
        this.score = 0;
        this.gameOver = false;
        this.player.reset();
    }
}

class Player
{
	constructor(x,y)
	{
		this.isAlive = true;
        this.top = y;
        this.bottom = y + BOARD_HEIGHT;
		this.x = x + BOARD_WIDTH/2-PLAYER_SIZE/2;
		this.y = y + BOARD_HEIGHT - PLAYER_SIZE;
        this.vx = 0;
        this.vy = 0;
        this.brain = new Neuron();
        this.meters = 0;
        this.isGrounded = true;
        let a = this;
        document.addEventListener('keydown', (e) => {
            if(e.keyCode==32) a.isAlive = false;
        });
	}
    reset()
    {
        this.isAlive = true;
        this.y = this.top + BOARD_HEIGHT - PLAYER_SIZE;
        this.vy = 0;
        this.meters = 0;
    }

    think(pin)
    {
        let dt = pin.x-this.x+PLAYER_SIZE; //distancia del pin
        let db = 0; //distancia del suelo
        if(this.brain.out(dt,db)>0.5)
        {
            this.jump();
        }
    }

    collission(pin)
    {
        if (this.y+PLAYER_SIZE>this.bottom) 
        {
            this.isGrounded = true;
            this.y = this.bottom - PLAYER_SIZE;
            this.vy = 0;
        }
        return (pin.x<this.x+PLAYER_SIZE&&this.x<pin.x+PIN_SIZE)&&
        (this.y+PLAYER_SIZE>pin.y);
    }

    jump()
    {
        if(this.isGrounded)
        {
            this.vy=-JUMP_SIZE;
            this.isGrounded = false;
        }
        
    }

    move()
    {
        this.vy += GRAVITY;
        this.y += this.vy;
        this.meters++;
    }

	draw()
	{
		new Rectangle(this.x,this.y,PLAYER_SIZE,PLAYER_SIZE, "red").draw();
	}
}

class Pin
{
    constructor(x,y)
    {
        this.top = y;
        this.bottom = y + BOARD_HEIGHT;
        this.left = x;
        this.x = x + BOARD_WIDTH+Math.random()*50;
        this.y = y + BOARD_HEIGHT - PIN_SIZE;
        this.vx = 5;
        this.vy = 0;
    }

    move()
    {
        this.x-=this.vx;
        if(this.x<this.left)
        {
            this.x = this.left+BOARD_WIDTH+Math.random()*50;
        }
    }

    draw()
    {
        if(this.x>this.left&&this.x+PIN_SIZE<this.left+BOARD_WIDTH)
        {
            new Rectangle(this.x,this.y,PIN_SIZE,PIN_SIZE, "yellow").draw();
        }

        
    }
}

class Game
{
	constructor()
	{
		this.background = new Rectangle(0, 0, 800, 640, "#424242");
        this.background.draw();
        this.boards = [];
        for (let i = 0; i < 10; i++)
        {
            for (let j = 0; j < 10; j++)
            {
                this.boards.push(new Board(j, i));
            }
        }
        this.finished = false;
	}

    sort()
    {
        for(let i = 0; i<this.boards.length-1;i++)
        {
            let max = this.boards[i].player.meters;
            let pos = i;
            for(let j = i; j<this.boards.length;j++)
            {
                if(this.boards[j].player.meters>max)
                {
                    max = this.boards[j].player.meters;
                    pos = j;
                }
            }
            let ax = this.boards[i];
            this.boards[i] = this.boards[pos];
            this.boards[pos]=ax;
        }
    }

    kill()
    {
        for(let i = SURVIVORS;i<POPULATION;i++)
        {
            this.boards[i].player.brain=null;
        }
    }

    select()
    {
        this.kill();
        for(let i = SURVIVORS;i<POPULATION;i++)
        {
            this.mix(i);
            this.mutate(i);
        }
    }

    mix(i)
    {
        let p = this.boards[Math.round(MIX_SURVIVORS*Math.random())];
        let m = this.boards[Math.round(MIX_SURVIVORS*Math.random())];

        let childBrain = new Neuron();
        this.boards[i].player.brain=childBrain;
        if(Math.random()>0.5)
        {
            this.boards[i].player.brain.w1=p.player.brain.w1;
        }
        else
        {
            this.boards[i].player.brain.w1=m.player.brain.w1;
        }
        if(Math.random()>0.5)
        {
            this.boards[i].player.brain.w2=p.player.brain.w2;
        }
        else
        {
            this.boards[i].player.brain.w2=m.player.brain.w2;
        }
    }

    mutate(i)
    {
        if(Math.random()<MUTATION_RATE)
        {
            this.boards[i].player.brain.w1 = Math.random()*2-1;
            this.boards[i].player.brain.w2 = Math.random()*2-1;
        }
    }

	reset()
	{
		this.finished = false;
        this.sort();
        this.select();
        this.boards.forEach(e=>e.reset());
	}

	loop()
	{
		if(!this.finished)
        {
            this.background.draw();
            for (let i = 0; i < 11; i++)
            {
                ctx.strokeStyle = "grey";
                ctx.beginPath();
                ctx.moveTo(0, BOARD_WIDTH * i);
                ctx.lineTo(WIDTH, BOARD_WIDTH * i);
                ctx.moveTo(BOARD_WIDTH * i, 0);
                ctx.lineTo(BOARD_WIDTH * i, HEIGHT);
                ctx.stroke();
                ctx.closePath();
            }

            this.finished = true;
            this.boards.forEach(e=>
            {
                e.draw();
                if(!e.gameOver)
                {
                    this.finished = false;
                }
            });

        }
        else
        {
            this.reset();
        }
	}

}

class Sigmoid
{
    F(x)
    {
        return 1/(1+Math.exp(-x));
    }
}



class Neuron
{
    constructor()
    {
        this.w1 = Math.random()*2-1;
        this.w2 = Math.random()*2-1;
        this.b = 1; 
        this.f = new Sigmoid();  
    }

    out(x1,x2)
    {
        return this.f.F(this.w1*x1+this.w2*x2+this.b);
    }
}

let game = new Game();

function loop() 
{
	game.loop();
}





window.setInterval(loop,50);

