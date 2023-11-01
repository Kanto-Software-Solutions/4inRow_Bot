class Agent {
	constructor() { }

	init(color, board, time = 20000) {
		this.color = color
		this.time = time
		this.size = board.length
	}

	// Must return an integer representing the column to put a piece
	//                           column
	//                             | 
	compute(board, time) { return 0 }
}

/*
 * A class for board operations (it is not the board but a set of operations over it)
 */
class Board {
	constructor() { }

	// Initializes a board of the given size. A board is a matrix of size*size of characters ' ', 'B', or 'W'
	init(size) {
		var board = []
		for (var i = 0; i < size; i++) {
			board[i] = []
			for (var j = 0; j < size; j++)
				board[i][j] = ' '
		}
		return board
	}

	// Deep clone of a board the reduce risk of damaging the real board
	clone(board) {
		var size = board.length
		var b = []
		for (var i = 0; i < size; i++) {
			b[i] = []
			for (var j = 0; j < size; j++)
				b[i][j] = board[i][j]
		}
		return b
	}

	// Determines if a piece can be set at column j 
	check(board, j) {
		return (board[0][j] == ' ')
	}

	// Computes all the valid moves for the given 'color'
	valid_moves(board) {
		var moves = []
		var size = board.length
		for (var j = 0; j < size; j++)
			if (this.check(board, j)) moves.push(j)
		return moves
	}

	// Computes the new board when a piece of 'color' is set at column 'j'
	// If it is an invalid movement stops the game and declares the other 'color' as winner
	move(board, j, color) {
		var size = board.length
		var i = size - 1;
		while (i >= 0 && board[i][j] != ' ') i--;
		if (i < 0) return false;
		board[i][j] = color
		return true
	}

	// Determines the winner of the game if available 'W': white, 'B': black, ' ': none
	winner(board, k) {
		//console.log(k)
		var size = board.length
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				var p = board[i][j]
				if (p != ' ') {
					if (j + k <= size && i + k <= size) {
						var c = 1
						for (var h = 1; h < k; h++)
							if (board[i + h][j + h] == p) c++
						if (c == k) return p
					}
					if (j + 1 >= k && i + k <= size) {
						var c = 1
						for (var h = 1; h < k; h++)
							if (board[i + h][j - h] == p) c++
						if (c == k) return p

					}
					if (j + k <= size) {
						var c = 1
						for (var h = 1; h < k; h++)
							if (board[i][j + h] == p) c++
						if (c == k) return p

					}
					if (i + k <= size) {
						var c = 1
						for (var h = 1; h < k; h++)
							if (board[i + h][j] == p) c++
							else break;
						if (c == k) return p
					}
				}
			}
		}
		return ' '
	}

	// Draw the board on the canvas
	print(board) {
		var size = board.length
		// Commands to be run (left as string to show them into the editor)
		var grid = []
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++)
				grid.push({ "command": "translate", "y": i, "x": j, "commands": [{ "command": "-" }, { "command": board[i][j] }] })
		}

		var commands = { "r": true, "x": 1.0 / size, "y": 1.0 / size, "command": "fit", "commands": grid }
		Konekti.client['canvas'].setText(commands)
	}
}
class EA extends Agent {
	board;				//Tablero
	colorJugador;		//Color del jugador
	movVictoria;		//Fichas en linea  x ganar (k)
	tamTablero;			//Tamaño tablero
	movPosibles = [];	//Movimientos posibles
	tiempo;				//Tiempo disponible
	tInicial;			//Tiempo inicial
	ficha;				//Ficha a jugar
	movRestantes;		//Movimientos restantes

	constructor() {
		super()
		this.board = new Board()
	}
	init(color, b1, time) {
		this.colorJugador = color
		this.tiempo = time
		this.tamTablero = parseInt(Konekti.vc('size').value)
		this.movVictoria = parseInt(Konekti.vc('k').value)
		this.movRestantes = parseInt(this.tamTablero * this.tamTablero / 2)

	}
	imprimirPrueba(tablero) {
		console.log('Color: ' + this.colorJugador, '\nTiempo: ' + this.tiempo, '\nPosibles: ' + this.movPosibles, 'Restantes: ' + this.movRestantes);
		console.log('Mejor movimiento: ' + this.ficha);
		var endT = Date.now();
		console.log('Tiempo requerido: ' + (endT - this.tInicial), 'Tiempo restante: ' + (this.tiempo - (endT - this.tInicial)))
		console.log(tablero);
		console.log('-------------------------------------------------------------------------');

	}
	validarFinales(tablero, color, movimientos) {
		//Verifica en cada movimiento si es posible la victoria
		let valorFinal = -1
		movimientos.forEach(valor => {
			var tableroAux = this.board.clone(tablero)
			this.board.move(tableroAux, valor, color)
			if (this.board.winner(tableroAux, this.movVictoria) == color) {
				valorFinal = valor;
			}
		});
		if (valorFinal != -1) {
			return valorFinal;
		}
		return -1;
	}
	aleatorio() {
		return this.movPosibles[Math.floor(this.movPosibles.length * Math.random())];
	}
	bloquear(tablero) {
		let jugada = -1;
		//Busca jugadas finales propias en el proximo turno
		jugada = this.validarFinales(tablero, this.colorJugador, this.movPosibles);
		if (jugada != -1) {
			return jugada;
		}
		//Busca jugadas finales del oponente en el proximo turno
		jugada = this.validarFinales(tablero, this.colorJugador == 'W' ? 'B' : 'W', this.movPosibles);
		if (jugada != -1) {
			return jugada;
		}
		return jugada;
	}
	iniciarJugada(tablero, time) {
		this.tInicial = Date.now();
		this.tiempo = time;
		this.ficha = -1;
		this.movPosibles = this.board.valid_moves(tablero);
		this.movRestantes--;
	}
	minmax(tablero, profundidad, alpha, beta, maximizar) {
		let movimientos = this.board.valid_moves(tablero);

		let jugador = this.colorJugador;
		let rival = this.colorJugador == 'W' ? 'B' : 'W';

		let mejorMovimiento = -1;
		let victoria = this.board.winner(tablero, this.movVictoria);
		let valor = maximizar ? -999 : 999;

		//Verifica condiciones de fin de juego
		if (victoria == jugador) {
			//Si nosotros ganamos
			valor = 100;
			//console.log('Victoria con valor: ' + valor + ' Profundidad: ' + profundidad, ' MAX: ' + maximizar);
			//console.log(tablero);
			return [mejorMovimiento, valor];
		} else if (victoria == rival) {
			//Si gana el rival
			valor = -100;
			//console.log('Derrota con valor: ' + valor + ' Profundidad: ' + profundidad, ' MAX: ' + maximizar);
			//console.log(tablero);
			return [mejorMovimiento, valor];
		} else if (movimientos.length == 0) {
			//Si es empate
			valor = 0;
			//console.log('Empate con valor: ' + valor + ' Profundidad: ' + profundidad, ' MAX: ' + maximizar);
			//console.log(tablero);
			return [mejorMovimiento, valor];
		}

		for (let i = 0; i < movimientos.length; i++) {

			let movimiento = movimientos[i];
			let tableroAux = this.board.clone(tablero);
			this.board.move(tableroAux, movimiento, maximizar ? jugador : rival);

			let newValor = this.minmax(tableroAux, profundidad + 1, alpha, beta, maximizar ? false : true)[1];
			if (maximizar) {
				if (newValor > valor) {
					valor = newValor;
					mejorMovimiento = movimiento;
				}
				alpha = Math.max(alpha, valor);

			} else {
				if (newValor < valor) {
					valor = newValor;
					mejorMovimiento = movimiento;
				}
				beta = Math.min(beta, valor);
			}
			if (alpha >= beta) {
				//console.log('Corte alfa beta');
				break;
			}
		};
		console.log('Mejor movimiento: ' + mejorMovimiento + ' con valor: ' + valor + ' Profundidad: ' + profundidad, 'MAX: ' + maximizar);
		return [mejorMovimiento, valor];
	}
	evaluarPuntaje(tablero, jugador, rival, col, maximizar) {
		let puntaje = 0;
		//Mov que completan lineas
		if (jugador == this.board.winner(tablero, this.movVictoria - 1)) {
			puntaje += 20;
		}
		//Asegurar centro
		if (col == Math.floor(this.tamTablero / 2)) {
			puntaje += 50;
		}
		return puntaje;
	}
	mmDeep(tablero, profundidad, alpha, beta, maximizar, columna) {
		let movimientos = this.board.valid_moves(tablero);

		let jugador = this.colorJugador;
		let rival = this.colorJugador == 'W' ? 'B' : 'W';

		let mejorMovimiento = -1;
		let victoria = this.board.winner(tablero, this.movVictoria);
		let valor = maximizar ? -999 : 999;

		//Verifica condiciones de fin de juego
		if (victoria == jugador) {
			//Si nosotros ganamos
			valor = 100;
			return [mejorMovimiento, valor];
		} else if (victoria == rival) {
			//Si gana el rival
			valor = -100;
			return [mejorMovimiento, valor];
		} else if (movimientos.length == 0) {
			//Si es empate
			valor = 0;
			return [mejorMovimiento, valor];
		} else if (profundidad <= 0) {
			//Llega a la profundidad maxima
			valor = this.evaluarPuntaje(tablero, jugador, rival, columna, maximizar);
			return [mejorMovimiento, valor];
		}
		let temp = [0, 0, 0, 0, 0, 0, 0];

		for (let i = 0; i < movimientos.length; i++) {
			let movimiento = movimientos[i];
			let tableroAux = this.board.clone(tablero);
			this.board.move(tableroAux, movimiento, maximizar ? jugador : rival);
			let newValor = this.mmDeep(tableroAux, profundidad - 1, alpha, beta, maximizar ? false : true, movimiento)[1];
			temp[i] = newValor;
			if (maximizar) {
				if (newValor >= valor) {
					valor = newValor;
					mejorMovimiento = movimiento;
				}
				alpha = Math.max(alpha, valor);
			} else {
				if (newValor <= valor) {
					valor = newValor;
					mejorMovimiento = movimiento;
				}
				beta = Math.min(beta, valor);
			}
			if (alpha >= beta) {
				break;
			}
		};
		if (profundidad == 6) {
			console.log(temp + ' MAX: ' + maximizar);
		}
		if (profundidad == 7) {
			console.log(temp + ' MAX: ' + maximizar);
		}
		return [mejorMovimiento, valor];
	}
}

class EA_deep extends EA {
	constructor() {
		super()
	}
	compute(tablero, time) {
		this.iniciarJugada(tablero, time)
		if (this.movRestantes == Math.floor(this.tamTablero * this.tamTablero / 2) - 1 || this.movRestantes == Math.floor(this.tamTablero * this.tamTablero / 2) - 2) {
			this.ficha = Math.floor(this.tamTablero / 2);
			console.log('CENTRO SELECCIONADO: ' + this.ficha);
		} else {
			this.ficha = this.bloquear(tablero);
		}

		//Logica minmax
		if (this.ficha == -1) {
			let resultado = this.mmDeep(tablero, 7, -999, 999, true, 0);
			this.ficha = resultado[0];
			console.log('MinMax ' + this.ficha + ' con valor: ' + resultado[1]);
		} else {
			console.log('BLOQUEADOR: ' + this.ficha);
		}
		//Random por si acaso
		if (this.ficha == -1) {
			console.log('RANDOM SELECCIONADO: ' + this.ficha);
			alert('RANDOM SELECCIONADO: ' + this.ficha);
			this.ficha = this.aleatorio();
		}
		//this.imprimirPrueba(tablero)
		return this.ficha;
	}
}
//Solo funciona hasta con 4 * 4
class EA_minmax extends EA {
	constructor() {
		super()
	}
	compute(tablero, time) {
		this.iniciarJugada(tablero, time)
		this.ficha = this.bloquear(tablero);
		//Logica minmax
		if (this.ficha == -1) {
			this.ficha = this.minmax(tablero, 0, -Infinity, Infinity, true)[0];
		}
		if (this.ficha == -1) {
			this.ficha = this.aleatorio();
		}
		//this.imprimirPrueba(tablero)
		return this.ficha;
	}
}
//No mira futuros movimientos
class EA_bloqueante extends EA {
	constructor() {
		super()
	}
	compute(tablero, time) {
		this.iniciarJugada(tablero, time)
		this.ficha = this.bloquear(tablero);
		if (this.ficha == -1) {
			this.ficha = this.aleatorio();
		}
		//this.imprimirPrueba(tablero)
		return this.ficha;
	}
}
//Aleatorio
class EA_random extends EA {
	constructor() {
		super()
	}
	compute(tablero, time) {
		this.iniciarJugada(tablero, time)
		this.ficha = this.aleatorio();
		//this.imprimirPrueba(tablero)
		return this.ficha;
	}
}

/*
 * Environment (Cannot be modified or any of its attributes accesed directly)
 */
class Environment extends MainClient {
	constructor() {
		super()
		this.board = new Board()
	}

	setPlayers(players) { this.players = players }

	// Initializes the game 
	init() {
		var white = Konekti.vc('W').value // Name of competitor with white pieces
		var black = Konekti.vc('B').value // Name of competitor with black pieces
		var time = 1000 * parseInt(Konekti.vc('time').value) // Maximum playing time assigned to a competitor (milliseconds)
		var size = parseInt(Konekti.vc('size').value) // Size of the reversi board
		var k = parseInt(Konekti.vc('k').value) // k-pieces in row

		this.k = k
		this.size = size
		this.rb = this.board.init(size)
		this.board.print(this.rb)
		var b1 = this.board.clone(this.rb)
		var b2 = this.board.clone(this.rb)

		this.white = white
		this.black = black
		this.ptime = { 'W': time, 'B': time }
		Konekti.vc('W_time').innerHTML = '' + time
		Konekti.vc('B_time').innerHTML = '' + time
		this.player = 'W'
		this.winner = ''

		this.players[white].init('W', b1, time)
		this.players[black].init('B', b2, time)
	}

	// Listen to play button 
	play() {
		var TIME = 10
		var x = this
		var board = x.board
		x.player = 'W'
		Konekti.vc('log').innerHTML = 'The winner is...'

		x.init()
		var start = -1

		function clock() {
			if (x.winner != '') return
			if (start == -1) setTimeout(clock, TIME)
			else {
				var end = Date.now()
				var ellapsed = end - start
				var remaining = x.ptime[x.player] - ellapsed
				Konekti.vc(x.player + '_time').innerHTML = remaining
				Konekti.vc((x.player == 'W' ? 'B' : 'W') + '_time').innerHTML = x.ptime[x.player == 'W' ? 'B' : 'W']

				if (remaining <= 0) x.winner = (x.player == 'W' ? x.black : x.white) + ' since ' + (x.player == 'W' ? x.white : x.black) + 'got time out'
				else setTimeout(clock, TIME)
			}
		}

		function compute() {
			var w = x.player == 'W'
			var id = w ? x.white : x.black
			var nid = w ? x.black : x.white
			var b = board.clone(x.rb)
			start = Date.now()
			var action = x.players[id].compute(b, x.ptime[x.player])
			var end = Date.now()
			var flag = board.move(x.rb, action, x.player)
			if (!flag) {
				x.winner = nid + ' ...Invalid move taken by ' + id + ' on column ' + action
			} else {
				var winner = board.winner(x.rb, x.k)
				if (winner != ' ') {
					x.winner = winner
					console.log('El ganador es: ' + winner)
				}
				else {
					var ellapsed = end - start
					x.ptime[x.player] -= ellapsed
					Konekti.vc(x.player + '_time').innerHTML = '' + x.ptime[x.player]
					if (x.ptime[x.player] <= 0) {
						x.winner = nid + ' since ' + id + ' got run of time'
					} else {
						x.player = w ? 'B' : 'W'
					}
				}
			}

			board.print(x.rb)
			start = -1
			if (x.winner == '') setTimeout(compute, TIME)
			else Konekti.vc('log').innerHTML = 'The winner is ' + x.winner
		}

		board.print(x.rb)
		setTimeout(clock, 1000)
		setTimeout(compute, 1000)
	}
}
// Drawing commands
function custom_commands() {
	return [
		{
			"command": " ", "commands": [
				{
					"command": "fillStyle",
					"color": { "red": 255, "green": 255, "blue": 255, "alpha": 255 }
				},
				{
					"command": "polygon",
					"x": [0.2, 0.2, 0.8, 0.8],
					"y": [0.2, 0.8, 0.8, 0.2]
				}

			]
		},
		{
			"command": "-",
			"commands": [
				{
					"command": "strokeStyle",
					"color": { "red": 0, "green": 0, "blue": 0, "alpha": 255 }
				},
				{
					"command": "polyline",
					"x": [0, 0, 1, 1, 0],
					"y": [0, 1, 1, 0, 0]
				}
			]
		},
		{
			"command": "B",
			"commands": [
				{
					"command": "fillStyle",
					"color": { "red": 0, "green": 0, "blue": 0, "alpha": 255 }
				},
				{
					"command": "polygon",
					"x": [0.2, 0.2, 0.8, 0.8],
					"y": [0.2, 0.8, 0.8, 0.2]
				}
			]
		},
		{
			"command": "W",
			"commands": [
				{
					"command": "fillStyle",
					"color": { "red": 255, "green": 255, "blue": 0, "alpha": 255 }
				},
				{
					"command": "polygon",
					"x": [0.2, 0.2, 0.8, 0.8],
					"y": [0.2, 0.8, 0.8, 0.2]
				},
			]
		}
	]
}