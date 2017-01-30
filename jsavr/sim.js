var app = app || angular.module('app', []);

app.controller("AvrSimController", function($scope) {
	$scope.do_nothing = function(a) {}
	$scope.debug_log = $scope.do_nothing;
	$scope.status = "Ready";
	$scope.running = false;
	$scope.outputs = [];
	$scope.io_state = {
		'switch_state': ["OFF", "OFF", "OFF", "OFF", "OFF", "OFF", "OFF", "OFF"]
	};
	$scope.steps = {
		'count': 1
	};
	$scope.output_type = {
		"selection": "program"
	};
	$scope.cm_setup = function() {
		var sim_textarea = document.getElementById("simavr" + $scope.simid + "_program_area");
		$scope.debug_log($scope.simid, sim_textarea);
		if (sim_textarea == null) return;
		$scope.editor = CodeMirror.fromTextArea(sim_textarea, {
			lineNumbers: true,
			gutters: ["breakpoints", "CodeMirror-linenumbers"]
		});
		if ($scope.size) {
			if ($scope.size == "auto") {
				$scope.editor.setSize(null, ($scope.program.split("\n").length + 2) * ($scope.editor.defaultTextHeight()) + 10);
			} else {
				$scope.editor.setSize(null, $scope.size);
			}
		} else {
			$scope.editor.setSize(null, "70%");
		}
		$scope.editor.setOption("extraKeys", {
			'Ctrl-Enter': function(cm) {
				$scope.program_pm();
				$scope.$apply();
			}
		});
		$scope.editor.setValue($scope.program);
	}
	$scope.symbols = {};
	$scope.PM_display_mode = "t";
	$scope.RAM_display_mode = "d";
	$scope.RF_display_mode = "d";
	$scope.RAM = [];
	$scope.PM = [];
	$scope.RF = [];

	$scope.PIND = 0;
	$scope.PORTD = 0;
	$scope.DDRD = 0;
	$scope.SPH = 0;
	$scope.SPL = 0;

	$scope.RAM_size = 65536;
	$scope.PM_size = 65536;
	$scope.RF_size = 32;
	$scope.updated = [];
	$scope.error_line = 0;
	$scope.current_ram_data = [];
	$scope.reset_program = function() {
		if ($scope.running) return;
		if ($scope.text) {
			$scope.debug_log("Using text");
			$scope.program = $scope.text;
		} else if ($scope.original_program) {
			$scope.program = $scope.original_program;
		}
		$scope.change_program($scope.program);
	}

	$scope.reset = function(pm_reset) {
		$scope.io_state.switch_state = ["OFF", "OFF", "OFF", "OFF", "OFF", "OFF", "OFF", "OFF"];
		$scope.output_type.selection = "program";
		$scope.display_pm_start = 0;
		$scope.display_ram_start = 0;
		$scope.steps = {
			'count': 1
		};
		$scope.PC = 0;
		$scope.cycles = 0;
		$scope.C = 0;
		$scope.Z = 0;
		$scope.N = 0;
		$scope.V = 0;
		$scope.S = 0;
		$scope.H = 0;
		$scope.T = 0;
		$scope.I = 0;
		$scope.PIND = 0;
		$scope.PORTD = 0;
		$scope.DDRD = 0;
		$scope.SPH = 0;
		$scope.SPL = 0;
		$scope.updated = [];
		$scope.ram_updated = [];
		$scope.outputs = [];
		$scope.output_state = "READY";
		$scope.mux = new $scope.output_mux();
		$scope.lcd = new $scope.char_display();
		$scope.output_devs = [];
		$scope.output_devs.push($scope.lcd);
		for (var i = 0; i < $scope.RF_size; i++) $scope.RF[i] = 0;
		for (var i = 0; i < $scope.RAM_size; i++) $scope.RAM[i] = 0;
		for (var i = 0; i < $scope.IORF_size; i++) $scope.IORF[i] = 0;
		var nop = $scope.parse("nop", 0);
		if (pm_reset) {
			for (var i = 0; i < $scope.PM_size; i++) {
				nop.addr = i;
				$scope.PM[i] = nop;
			}
		}
		if (!pm_reset) {
			for (var i = 0; i < $scope.current_ram_data.length; i++) $scope.RAM[i + 1024] = $scope.current_ram_data[i];
		}
		if ($scope.editor) $scope.editor.removeLineClass($scope.error_line, "background", "active_line");
	}
	$scope.display_pm_start = 0;
	$scope.display_ram_start = 0;
	$scope.display_pm_length = 16;
	$scope.display_ram_length = 16;

	$scope.change_program = function(prog) {
		$scope.program = prog;
		if ($scope.editor) $scope.editor.setValue(prog);
	}
	$scope.display_ram = function(i) {
		if ($scope.RAM_display_mode == "d") {
			return $scope.RAM[i];
		} else if ($scope.RAM_display_mode == "2") {
			return $scope.truncate($scope.RAM[i], 8, true);
		} else if ($scope.RAM_display_mode == "c") {
			return String.fromCharCode($scope.RAM[i])
		}
	}
	$scope.display_rf = function(i) { // possibly change to k's, possibly change to s's
		if ($scope.RF_display_mode == "d") {
			return $scope.truncate($scope.RF[i], 8, false);
		}
		if ($scope.RF_display_mode == "2") {
			return $scope.truncate($scope.RF[i], 8, true);
		} else if ($scope.RF_display_mode == "b") {
			var s = $scope.RF[i].toString(2);
			return smul("0", 8 - s.length) + s;
		} else if ($scope.RF_display_mode == "h") {
			var s = $scope.RF[i].toString(16);
			return "0x" + smul("0", 2 - s.length) + s;
		}
	}
	$scope.program_pm = function() {
		if ($scope.running) return;
		$scope.reset(true);
		$scope.running = true;
		$scope.program = $scope.editor.getValue();
		var pm_data = $scope.preparse($scope.program);
		if (!pm_data) {
			$scope.running = false;
			return;
		}
		var pm_addr = 0;
		for (var i = 0; i < pm_data.length; i++) {
			var datum = pm_data[i];
			if (datum.inst) {
				var inst = $scope.parse(datum.inst, pm_addr);
				if (!inst) continue;
				if (inst.error) {
					$scope.error_on_line(datum.line, inst.error);
					return;
				}
				$scope.PM[pm_addr] = inst;
				pm_addr++;
			} else if (datum.word) {
				var inst = $scope.decode(datum.word, pm_addr);
				if (inst.error) {
					$scope.error_on_line(datum.line, inst.error);
					return;
				}
				$scope.PM[pm_addr] = inst;
				pm_addr++;
			}
		}
		$scope.status = "Ready";
	}
	$scope.error_on_line = function(linenum, err_msg) {
		$scope.running = false;
		$scope.status = "Error on line " + linenum + ": " + err_msg;
		$scope.error_line = linenum;
		if ($scope.editor) $scope.editor.addLineClass(linenum, "background", "active_line");
	}
	$scope.preparse = function() {
		var lines = $scope.program.split("\n");
		var to_program = [];
		var pm_offset = 0;
		var ram_offset = 1024;
		for (var i = 0; i < lines.length; i++) {
			var pieces = lines[i].match(/^((?:[^";]|';'|"(?:[^\\"]+|\\(?:\\\\)*[nt\\"])*")*)(;.*)?$/)
			$scope.debug_log("P", pieces);
			if (!pieces) {
				$scope.error_on_line(i, "Invalid line: " + i);
				return;
			}
			if (!pieces[1]) continue;
			lines[i] = pieces[1].trim();
			var is_inst = true;
			for (var d in $scope.directives) {
				var matches = lines[i].match($scope.directives[d].regex)
				$scope.debug_log("D", lines[i], d, matches);
				if (matches) {
					// process needs to return:
					// - What it inserts to PM (pm_data)
					// - What it inserts into RAM (ram_data)
					// - What symbol it wants to make (symbol)
					// - What kind of symbol it is (symbol_type == "pm" | "ram")
					// - Whether there was an error (error)
					var result = $scope.directives[d].process(matches);
					// Handle error
					if (result.error) {
						$scope.error_on_line(i, result.error);
						return;
					}
					// Update symbol
					if (result.symbol && result.symbol_type) {
						if (result.symbol_type == "pm") {
							$scope.symbols[result.symbol] = pm_offset;
						} else if (result.symbol_type == "ram") {
							$scope.symbols[result.symbol] = ram_offset;
						}
					}
					// Insert data and update offsets
					if (result.pm_data) {
						for (var j = 0; j < result.pm_data.length; j++) {
							to_program.push({
								'word': result.pm_data[j],
								'line': i
							});
						}
						pm_offset += result.pm_data.length;
					}
					if (result.ram_data) {
						for (var j = 0; j < result.ram_data.length; j++) {
							$scope.RAM[ram_offset + j] = result.ram_data[j];
						}
						$scope.current_ram_data = $scope.current_ram_data.concat(result.ram_data);
						ram_offset += result.ram_data.length;
					}
					is_inst = false;
					break;
				}
			}
			if (is_inst && !(/^[ \t]*$/.test(lines[i]))) {
				to_program.push({
					'inst': lines[i],
					'line': i
				});
				pm_offset++;
			}
		}
		return to_program;
	}
	$scope.parse = function(inst, addr) {
		$scope.debug_log(inst)
		var matches = inst.match(/^[ \t]*([a-zA-Z]+)[ \t]*((?:[^;]|';')*)[ \t]*$/)
		if (!matches) {
			return {
				"error": "Line does not match any directive or instruction"
			};
		}
		var mnemonic = matches[1];
		var operand = matches[2];
		$scope.debug_log(mnemonic, "|||", operand);
		if (mnemonic in $scope.instructions) {
			var format = $scope.instructions[mnemonic].format;
			var execf = $scope.instructions[mnemonic].exec;
			var ops = operand.match($scope.formats[format].string);
			if (!ops) {
				return {
					"error": "Operands to instruction " + inst + " did not parse"
				};
			}
			for (var i = 0; i < 3; i++) {
				if (/^[0-9]+$/.test(ops[i])) ops[i] = parseInt(ops[i]);
				//else if(format.sym_valid[i]) ops[i] = symbols[ops[i]];
			}
			var opcode = $scope.instructions[mnemonic].c;
			$scope.debug_log(format, execf, ops, opcode);
			var data = {
				"d": ops[1],
				"a": ops[2],
				"k": ops[3],
				"c": opcode
			};
			var new_inst = new $scope.instruction(mnemonic + " " + operand, mnemonic, data, execf, addr);
			if (new_inst.error) {
				return {
					"error": inst.error
				};
			}
			if (new_inst.check_valid()) {
				return new_inst;
			} else {
				return {
					"error": "Illegal operands to instruction " + inst
				};
			}
		} else {
			return {
				"error": "Invalid instruction " + inst
			};
		}
		return null;
	}
	$scope.is_updated = function(x) {
		for (var i = 0; i < $scope.updated.length; i++) {
			if ($scope.updated[i] == x) return true;
		}
		return false;
	}
	$scope.is_ram_updated = function(x) {
		for (var i = 0; i < $scope.updated.length; i++) {
			if ($scope.ram_updated[i] == x) return true;
		}
		return false;
	}
	$scope.handle_string_escapes = function(s) {
		s = s.replace(/(([^\\]|)(\\\\)*)\\t/g, "$1\t");
		s = s.replace(/(([^\\]|)(\\\\)*)\\n/g, "$1\n");
		s = s.replace(/(([^\\]|)(\\\\)*)\\"/g, "$1\"");
		s = s.replace(/\\\\/g, "\\");
		return s;
	}
	$scope.directives = {
		"label": {
			"regex": /^([a-zA-Z_][a-zA-Z0-9_]*):$/,
			"process": function(args) {
				return {
					"symbol": args[1],
					"symbol_type": "pm",
				};
			}
		},
		"word": {
			"regex": /^\.word ([0-9,]+)$/,
			"process": function(args) {
				var rdata = args[1].split(",");
				for (var i = 0; i < rdata.length; i++) {
					rdata[i] = $scope.truncate(parseInt(rdata[i]), 16, false);
				}
				return {
					"symbol": args[1],
					"symbol_type": "pm",
					"pm_data": rdata
				};
			}
		},
		"byte_ram": {
			"regex": /^ *\.byte\(([a-zA-Z_][a-zA-Z0-9_]*)\) ([-0-9, ]+) *$/,
			"process": function(args) {
				var rdata = args[2].split(",");
				for (var i = 0; i < rdata.length; i++) {
					rdata[i] = $scope.truncate(parseInt(rdata[i].trim()), 8, false);
				}
				return {
					"symbol": args[1],
					"symbol_type": "ram",
					"ram_data": rdata
				};
			}
		},
		"string_ram": {
			"regex": /^ *\.string\(([a-zA-Z_][a-zA-Z0-9_]*)\) "((?:[^"\\]|\\.)*)" *$/,
			"process": function(args) {
				var str = $scope.handle_string_escapes(args[2]);
				var rdata = []
				for (var i = 0; i < str.length; i++) {
					rdata.push($scope.truncate(str.charCodeAt(i), 8, false));
				}
				rdata.push(0);
				return {
					"symbol": args[1],
					"symbol_type": "ram",
					"ram_data": rdata
				};

			}
		}
	};
	// X,*:  111
	// Y,"": 010
	// Y,+-" 110
	// Z,"": 000
	// Z,+-: 100
	// "":  00
	// "+": 01
	// "-": 10
	$scope.encode_r = function(k) {
		var r = 0;
		var ptr = k[0] == "-" ? k[1] : k[0];
		var mod = k[0] == "-" ? "-" : (k[1] == "+" ? "+" : "");
		if (ptr == "X") r = 7 * 4
		if (ptr == "Y") r = 6 * 4
		if (ptr == "Z") r = 4 * 4
		if (ptr != "X" && mod == "") r -= 16;
		if (mod == "+") r += 1;
		if (mod == "-") r += 2;
		return r;
	}
	$scope.decode_r = function(r) {
		var ptr = "";
		var mod = "";
		$scope.debug_log("XX", r, r & 3, (r >> 2) & 3)
		if (((r >> 2) & 3) == 3) ptr = "X";
		if (((r >> 2) & 3) == 2) ptr = "Y";
		if (((r >> 2) & 3) == 0) ptr = "Z";
		if ((r & 3) == 1) mod = "+";
		if ((r & 3) == 2) mod = "-";
		$scope.debug_log("X=", mod, ptr)
		return mod == "-" ? mod + "" + ptr : ptr + "" + mod;
	}
	$scope.formats = {
		// i->K, r->d, s->A, x->r, c->bin
		"4d8k": {
			"string": / *r([0-9]+), *()(-?[a-zA-Z_0-9)(-]+|'..?') *$/,
			"to_string": function(mnemonic, c, d, a, k) {
				return mnemonic + " d" + d + "," + k;
			},
			"binary": "CCCCKKKKDDDDKKKK",
			"k_bits": 8,
			"validator": function(c, d, a, k) {
				return 16 <= d && d < 32 && -128 <= k && k < 256;
			}
		},
		"5d5a": {
			"string": / *r([0-9]+), *r([0-9]+)() *$/,
			"to_string": function(mnemonic, c, d, a, k) {
				return mnemonic + " d" + d + ",d" + a;
			},
			"binary": "CCCCCCADDDDDAAAA",
			"validator": function(c, d, a, k) {
				return 0 <= d && d < 32 && 0 <= a && a < 32;
			}
		},
		"6a5d": {
			"string": / *r([0-9]+), *([0-9]+)() *$/,
			"to_string": function(mnemonic, c, d, a, k) {
				return mnemonic + " d" + d + "," + a;
			},
			"binary": "CCCCCAADDDDDAAAA",
			"validator": function(c, d, a, k) {
				return 0 <= d && d < 32 && 0 <= a && a < 64;
			}
		},
		"5d6a": {
			"string": / *([0-9]+), *r([0-9]+)() *$/,
			"to_string": function(mnemonic, c, d, a, k) {
				return mnemonic + " " + d + ",d" + a;
			},
			"binary": "CCCCCAADDDDDAAAA",
			"validator": function(c, d, a, k) {
				return 0 <= d && d < 64 && 0 <= a && a < 32;
			}
		},
		"5d": {
			"string": / *r([0-9]+)()() *$/,
			"to_string": function(mnemonic, c, d, a, k) {
				return mnemonic + " d" + d;
			},
			"binary": "CCCCCCCDDDDDCCCC",
			"validator": function(c, d, a, k) {
				return 0 <= d && d < 32;
			}
		},
		"5dR": {
			"string": / *r([0-9]+)(), *(-[XYZ]|[XYZ]|[XYZ]\+) *$/,
			"to_string": function(mnemonic, c, d, a, k, r) {
				return mnemonic + " d" + d + "," + k
			},
			"binary": "CCCRCCCDDDDDRRRR",
			"validator": function(c, d, a, k) {
				return 0 <= d && d < 32;
			}
		},
		"R5d": {
			"string": / *(-[XYZ]|[XYZ]|[XYZ]\+), *r([0-9]+)() *$/,
			"to_string": function(mnemonic, c, d, a, k, r) {
				return mnemonic + " " + d + ",d" + a;
			},
			"binary": "CCCRCCCDDDDDRRRR",
			"validator": function(c, d, a, k) {
				return 0 <= a && a < 32;
			}
		},
		"12k": {
			"string": / *()()(-?[a-zA-Z_0-9)(]+) *$/,
			"to_string": function(mnemonic, c, d, a, k) {
				return mnemonic + " " + k;
			},
			"binary": "CCCCKKKKKKKKKKKK",
			"k_bits": 12,
			"validator": function(c, d, a, k) {
				return -2048 <= k && k < 2048;
			}
		},
		"7k": {
			"string": / *()()(-?[a-zA-Z_0-9)(]+) *$/,
			"to_string": function(mnemonic, c, d, a, k) {
				return mnemonic + " " + k;
			},
			"binary": "CCCCCCKKKKKKKCCC",
			"k_bits": 7,
			"validator": function(c, d, a, k) {
				return -64 <= k && k < 64;
			}
		},
		"n": {
			"string": / *()()() *$/,
			"to_string": function(mnemonic, c, d, a, k) {
				return mnemonic;
			},
			"binary": "CCCCCCCCCCCCCCCC",
			"validator": function(c, d, a, k) {
				return true;
			}
		}
	}
	$scope.encode = function(format, c, d, a, k) {
		var fmt = $scope.formats[format].binary;
		var inst = 0;
		var r = 0;
		if (format == "5d6a") {
			k = a;
			a = d;
			d = k;
		} else if (format == "5dR" || format == "R5d") {
			if (format == "R5d") {
				k = d;
				d = a;
			}
			$scope.debug_log("Re", k);
			r = $scope.encode_r(k);
			$scope.debug_log("Rd", r);
		}
		for (var i = 15; i >= 0; i--) {
			if (fmt[i] == "C") {
				inst += (c % 2) << (15 - i);
				c >>= 1;
			}
			if (fmt[i] == "D") {
				inst += (d % 2) << (15 - i);
				d >>= 1;
			}
			if (fmt[i] == "A") {
				inst += (a % 2) << (15 - i);
				a >>= 1;
			}
			if (fmt[i] == "K") {
				inst += (k % 2) << (15 - i);
				k >>= 1;
			}
			if (fmt[i] == "R") {
				inst += (r % 2) << (15 - i);
				r >>= 1;
			}
		}
		return inst;
	}
	$scope.decode = function(x, addr) {
		for (var f in $scope.formats) {
			fmt = $scope.formats[f];
			var data = {
				"c": 0,
				"d": 0,
				"a": 0,
				"k": 0,
				"r": 0
			}
			for (var i = 15; i >= 0; i--) {
				//$scope.debug_log("i",i,fmt.binary[15-i],(x>>i)%2);
				if (fmt.binary[15 - i] == "C") data.c = (data.c * 2) + ((x >> i) % 2);
				if (fmt.binary[15 - i] == "D") data.d = (data.d * 2) + ((x >> i) % 2);
				if (fmt.binary[15 - i] == "A") data.a = (data.a * 2) + ((x >> i) % 2);
				if (fmt.binary[15 - i] == "K") data.k = (data.k * 2) + ((x >> i) % 2);
				if (fmt.binary[15 - i] == "R") data.r = (data.r * 2) + ((x >> i) % 2);
			}
			if (f == "4d8k") data.d += 16;
			if (f == "12k") data.k = $scope.truncate(data.k, 12, true);
			if (f == "7k") data.k = $scope.truncate(data.k, 7, true);
			if (f == "5dR") data.k = $scope.decode_r(data.r);
			if (f == "R5d") {
				data.a = data.d;
				data.d = $scope.decode_r(data.r);
			}
			if (f == "5d6a") {
				var temp = data.d;
				data.d = data.a;
				data.a = temp;
			}
			for (var mnemonic in $scope.instructions) {
				inst = $scope.instructions[mnemonic];
				if (inst.format == f && inst.c == data.c) {
					return new $scope.instruction(x, mnemonic, data, inst.exec, addr);
				}
			}
		}
		return {
			"error": "Could not decode instruction: " + x
		};
	}
	$scope.label = function(name, addr) {
		this.label = true;
		this.name = name;
		this.addr = addr;
	}
	$scope.output_mux = function() {
		this.SEL_ADDR = 0;
		this.SEL_LEN = 1;
		this.SEL_TARGET = 2;

		this.target = 0;
		this.len = 0;
		this.state = 0;
		var self = this;
		this.input = function(val) {
			$scope.debug_log("MUX", val, self.state, self.target, self.len);
			if (self.state == self.SEL_ADDR) {
				self.target = val;
				self.state = self.SEL_LEN;
			} else if (self.state == self.SEL_LEN) {
				self.len = val;
				self.state = self.target;
				self.target = 0;
				self.state = self.SEL_TARGET;
			} else if (self.state == self.SEL_TARGET) {
				if (self.len > 0) {
					if (self.target < $scope.output_devs.length)
						$scope.output_devs[self.target].input(val);
					self.len--;
				}
				if (self.len == 0) {
					self.state = self.SEL_ADDR;
				}
			}
			$scope.debug_log("MUX_end", val, self.state, self.target, self.len);
		}
	}
	$scope.char_display = function() {
		this.cursor_x = 0;
		this.cursor_y = 0;
		this.chars = [
			["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
		];
		this.state = "BASE";
		var self = this;
		this.input = function(val) {
			console.log("CHAR", val);
			if (self.state == "BASE") {
				if (val != 0x1b) {
					self.chars[self.cursor_y][self.cursor_x] = String.fromCharCode(val);
				} else {
					self.state = "ESC";
				}
			} else if (self.state == "ESC") {
				if (val == 67) {
					self.cursor_x++;
					if (self.cursor_x == 16) {
						self.cursor_x = 0;
						self.cursor_y++;
						if (self.cursor_y == 4) self.cursor_y = 0;
					}
					self.state = "BASE";
				} else if (val == 68) {
					self.cursor_x--;
					if (self.cursor_x == -1) {
						self.cursor_x = 15;
						self.cursor_y--;
						if (self.cursor_y == -1) self.cursor_y = 3;
					}
					self.state = "BASE";
				} else if (val == 72) {
					self.state = "CURSORX";
				} else self.state = "BASE";
			} else if (self.state == "CURSORX") {
				self.cursor_x = $scope.truncate(val, 4, false);
				self.state = "CURSORY"
			} else if (self.state == "CURSORY") {
				self.cursor_y = $scope.truncate(val, 2, false);
				self.state = "BASE";
			}
		}
	}
	$scope.set_PM_display_mode = function(m) {
		$scope.PM_display_mode = m;
	}
	$scope.set_RAM_display_mode = function(m) {
		$scope.RAM_display_mode = m;
	}
	$scope.set_RF_display_mode = function(m) {
		$scope.RF_display_mode = m;
	}
	$scope.instruction = function(text, mnemonic, data, exec, addr) {
		thislabel = false;
		this.addr = addr;
		this.text = text;
		this.c = data.c;
		this.d = data.d;
		this.a = data.a;
		this.k = data.k;
		this.exec = exec;
		this.mnemonic = mnemonic;
		$scope.debug_log(this.text, this.c, this.d, this.a, this.k, this.mnemonic);
		this.format = $scope.instructions[this.mnemonic].format;
		if (this.k.match) {
			matches = this.k.match(/(lo|hi)8\(([a-zA-Z_][a-zA-Z0-9_]*)\)/);
			if (matches) {
				if (matches[2] in $scope.symbols) {
					if (matches[1] == "lo") this.k = $scope.truncate($scope.symbols[matches[2]], 8, false);
					if (matches[1] == "hi") this.k = $scope.truncate($scope.symbols[matches[2]] >> 8, 8, false);
				} else {
					this.error = "Symbol not found " + matches[2];
				}
			} else if (this.k in $scope.symbols) {
				this.k = $scope.symbols[this.k];
				var fmt = $scope.formats[this.format];
				$scope.debug_log($scope.symbols, fmt.k_bits);
				if (fmt.k_bits) {
					this.k = $scope.truncate(this.k - this.addr - 1, fmt.k_bits, true);
				}
			} else if (/'[^'\\]'/.test(this.k)) {
				this.k = this.k.charCodeAt(1);
			} else if (this.k == "'\\''") {
				this.k = this.k.charCodeAt(2);
			} else if (this.k == "'\\\\'") {
				this.k = this.k.charCodeAt(2);
			} else if (this.k == "'\\n'") {
				this.k = 10;
			} else if (this.k == "'\\t'") {
				this.k = 9;
			} else if (/^[XYZ]$|^[XYZ]\+$|^-[XYZ]$/.test(this.k)) {
				this.k = this.k;
			} else this.k = parseInt(this.k);
		}
		this.encoding = $scope.encode(this.format, this.c, this.d, this.a, this.k < 0 ? $scope.truncate(this.k, $scope.formats[this.format].k_bits, false) : this.k);
		$scope.debug_log(this.text, this.c, this.d, this.a, this.k, this.mnemonic);
		var self = this;
		this.display = function() {
			if ($scope.PM_display_mode == "t") {
				return $scope.formats[self.format].to_string(self.mnemonic, self.c, self.d, self.a, self.k);
			} else if ($scope.PM_display_mode == "d") {
				return self.encoding;
			} else if ($scope.PM_display_mode == "h") {
				var s = self.encoding.toString(16);
				return "0x" + smul("0", 4 - s.length) + s;
			} else if ($scope.PM_display_mode == "b") {
				var s = self.encoding.toString(2);
				return smul("0", 16 - s.length) + s;
			}
		}
		this.check_valid = function() {
			return $scope.formats[self.format].validator(self.c, self.d, self.a, self.k);
		}
		this.run = function() {
			self.exec(self.c, self.d, self.a, self.k);
		}
	}

	function smul(str, num) {
		var acc = [];
		for (var i = 0;
			(1 << i) <= num; i++) {
			if ((1 << i) & num)
				acc.push(str);
			str += str;
		}
		return acc.join("");
	}
	$scope.step = function() { // possibly need to change these i's to k's
		if (!$scope.running) return;
		$scope.debug_log($scope.steps.count);
		for (var k = 0; k < $scope.steps.count; k++) {
			var i = $scope.PM[$scope.PC];
			$scope.debug_log("i", i);
			i.run();
			if ($scope.PC < $scope.display_pm_start || $scope.PC >= $scope.display_pm_start + $scope.display_pm_length) {
				$scope.display_pm_start = Math.max(0, $scope.PC - $scope.display_ram_length / 2);
			}
			if ($scope.ram_updated.length > 0) {
				$scope.display_ram_start = Math.max(0, Math.min.apply(Math, $scope.ram_updated) - $scope.display_ram_length / 2);
			}
			$scope.handle_output();
		}
	}
	$scope.handle_output = function() {
		var d = $scope.truncate($scope.PORTD, 8, false);
		var val = d & 127;
		var state = d >> 7;
		$scope.debug_log("oUT", val, state, $scope.output_state);
		if ($scope.output_state == "RESET" && state == 0) {
			$scope.output_state = "READY";
		} else if ($scope.output_state == "READY" && state == 1) {
			$scope.output_state = "RESET";
			$scope.mux.input(val);
		}
	}
	$scope.raise_error = function(s) {
		$scope.status = "Error: " + s;
	}
	$scope.truncate = function(num, bits, twos_complement) {
		var mod = 1 << bits;
		num = ((num % mod) + mod) % mod;
		return twos_complement ? (num >= 1 << (bits - 1) ? num - (1 << bits) : num) : num;
	}
	$scope.update_sreg = function(result, c, z, n, v, s, h, t, i) {
		$scope.debug_log("SREG for", result);
		if (c) $scope.C = result >= 256 || result < 0 ? 1 : 0;
		if (z) $scope.Z = $scope.truncate(result, 8, false) == 0 ? 1 : 0;
		if (n) $scope.N = $scope.truncate(result, 8, true) < 0 ? 1 : 0;
		// fix these - they are not correct
		if (v) $scope.V = result >= 256 || result < 0 ? 1 : 0; // change
		if (s) $scope.S = $scope.N ? +!$scope.V : +$scope.V; // implicit cast to 1,0
		if (h) $scope.H = $scope.truncate(result, 8, true) < 0 ? 1 : 0; // set if bit 3 if result is set
	}
	$scope.read_IO = function(a) {
		if (a == 16) return $scope.PIND & (~($scope.DDRD));
		else if (a == 17) return $scope.DDRD;
		else if (a == 61) return $scope.SPL;
		else if (a == 62) return $scope.SPH;
		return 0;
	}
	$scope.write_IO = function(a, val) {
		if (a == 18) {
			$scope.PORTD = $scope.DDRD & val;
			$scope.output();
		} else if (a == 17) $scope.DDRD = $scope.truncate(val, 8, false);
		else if (a == 61) $scope.SPL = $scope.truncate(val, 8, false);
		else if (a == 62) $scope.SPH = $scope.truncate(val, 8, false);
		if ($scope.output_type.selection == "simple") {
			$scope.PIND = 0;
			for (var i = 0; i < 8; i++)
				$scope.PIND |= ($scope.io_state.switch_state[i] == "ON" ? 1 << i : 0)
			$scope.PIND &= ~$scope.DDRD;
		}
	}
	$scope.inc_ptr = function(reg) {
		if ($scope.RF[reg] == -1 || $scope.RF[reg] == 255) {
			$scope.RF[reg] = 0
			$scope.RF[reg + 1] = $scope.truncate($scope.RF[reg + 1] + 1, 8, false);
		} else $scope.RF[reg]++;
		if ($scope.RF[reg] == 128) {
			$scope.RF[reg] = -128;
		}
	}
	$scope.dec_ptr = function(reg) {
		$scope.RF[reg]--;
		if ($scope.RF[reg] == -1) {
			$scope.RF[reg + 1] = $scope.truncate($scope.RF[reg + 1] - 1, 8, false);
		}
		if ($scope.RF[reg] < -128) {
			$scope.RF[reg] = 127;
		}
	}
	$scope.incSP = function() {
		$scope.SPL++;
		if ($scope.SPL == 256) {
			$scope.SPL = 0;
			$scope.SPH = $scope.truncate($scope.SPH + 1, 8, false);
		}
	}
	$scope.decSP = function() {
		$scope.SPL--;
		if ($scope.SPL == -1) {
			$scope.SPL = 255;
			$scope.SPH = $scope.truncate($scope.SPH - 1, 8, false);
		}
	}
	$scope.instructions = {
		"adc": {
			"format": "5d5a",
			"c": 7,
			"exec": function(c, d, a, k) {
				var oldC = $scope.C;
				$scope.update_sreg($scope.RF[d] + $scope.RF[a] + oldC, true, true, true, true, true, true, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] + $scope.RF[a] + oldC, 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "C", "Z", "N", "V", "S", "H"];
			}
		},
		"add": {
			"format": "5d5a",
			"c": 3,
			"exec": function(c, d, a, k) {
				$scope.update_sreg($scope.RF[d] + $scope.RF[a], true, true, true, true, true, true, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] + $scope.RF[a], 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "C", "Z", "N", "V", "S", "H"];
			}
		},
		"adiw": {},
		"and": {
			"format": "5d5a",
			"c": 8,
			"exec": function(c, d, a, k) {
				$scope.V = 0;
				$scope.update_sreg($scope.RF[d] & $scope.RF[a], false, true, true, false, true, false, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] & $scope.RF[a], 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "Z", "N", "V", "S"];
			}
		},
		"andi": {
			"format": "4d8k",
			"c": 7,
			"exec": function(c, d, a, k) {
				$scope.V = 0;
				$scope.update_sreg($scope.RF[d] & k, false, true, true, false, true, false, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] & k, 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "Z", "N", "V", "S"];
			}
		},
		"asr": {
			"format": "5d",
			"c": 1189,
			"exec": function(c, d, a, k) {
				var C = $scope.RF[d] % 2 == 0 ? 0 : 1;
				$scope.RF[d] = $scope.truncate($scope.truncate($scope.RF[d], 8, true) >> 1, 8, false);
				$scope.update_sreg($scope.RF[d], true, true, true, true, true, false, false, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "C", "Z", "N", "V", "S"];
			}
		},
		"bclr": {},
		"bld": {},
		"brbc": {},
		"brbs": {},
		"brcc": {
			"format": "7k",
			"c": 488,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.C == 0 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.C ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brcs": {
			"format": "7k",
			"c": 480,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.C == 1 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.C ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"break": {},
		"breq": {
			"format": "7k",
			"c": 481,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.Z == 1 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.Z ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brge": {
			"format": "7k",
			"c": 492,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + (($scope.N ? $scope.V : !$scope.V) ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.S ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brhc": {
			"format": "7k",
			"c": 493,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.H == 0 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.H ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brhs": {
			"format": "7k",
			"c": 485,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.H == 1 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.H ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brid": {
			"format": "7k",
			"c": 495,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.k == 0 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.I ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brie": {
			"format": "7k",
			"c": 487,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.k == 1 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.I ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brlo": {
			"format": "7k",
			"c": 480,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.C == 1 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.C ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brlt": {
			"format": "7k",
			"c": 484,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + (($scope.N ? !$scope.V : $scope.V) ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.S ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brmi": {
			"format": "7k",
			"c": 482,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.N == 1 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.N ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brne": {
			"format": "7k",
			"c": 489,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.Z == 0 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.Z ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brpl": {
			"format": "7k",
			"c": 490,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.N == 0 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.N ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brsh": {
			"format": "7k",
			"c": 488,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.C == 0 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.C ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brtc": {
			"format": "7k",
			"c": 494,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.T == 0 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.T ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brts": {
			"format": "7k",
			"c": 486,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.T == 1 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.T ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brvc": {
			"format": "7k",
			"c": 491,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.V == 0 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += (!$scope.V ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"brvs": {
			"format": "7k",
			"c": 483,
			"exec": function(c, d, a, k) {
				$scope.PC = $scope.truncate($scope.PC + 1 + ($scope.V == 1 ? (k <= 64 ? k : k - 128) : 0), 16, false);
				$scope.cycles += ($scope.V ? 2 : 1);
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"bset": {},
		"bst": {},
		"call": {},
		"cbi": {},
		"cbr": {},
		"clc": {
			"format": "n",
			"c": 38024,
			"exec": function(c, d, a, k) {
				$scope.C = 0;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "C"];
			}
		},
		"clh": {
			"format": "n",
			"c": 38104,
			"exec": function(c, d, a, k) {
				$scope.H = 0;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "H"];
			}
		},
		"cli": {
			"format": "n",
			"c": 38136,
			"exec": function(c, d, a, k) {
				$scope.I = 0;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "I"];
			}
		},
		"cln": {
			"format": "n",
			"c": 38056,
			"exec": function(c, d, a, k) {
				$scope.N = 0;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "N"];
			}
		},
		"clr": {},
		"cls": {
			"format": "n",
			"c": 38088,
			"exec": function(c, d, a, k) {
				$scope.S = 0;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "S"];
			}
		},
		"clt": {
			"format": "n",
			"c": 38120,
			"exec": function(c, d, a, k) {
				$scope.T = 0;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "T"];
			}
		},
		"clv": {
			"format": "n",
			"c": 38072,
			"exec": function(c, d, a, k) {
				$scope.V = 0;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "V"];
			}
		},
		"clz": {
			"format": "n",
			"c": 38040,
			"exec": function(c, d, a, k) {
				$scope.Z = 0;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "Z"];
			}
		},
		"com": {
			"format": "5d",
			"c": 1184,
			"exec": function(c, d, a, k) {
				$scope.C = 1;
				$scope.V = 0;
				$scope.update_sreg(~($scope.RF[d]), false, true, true, false, true, false, false, false);
				$scope.RF[d] = $scope.truncate(~($scope.RF[d]), 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "C", "Z", "N", "V", "S"];
			}
		},
		"cp": {
			"format": "5d5a",
			"c": 5,
			"exec": function(c, d, a, k) {
				$scope.update_sreg($scope.RF[d] - $scope.RF[a], true, true, true, true, true, true, false, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "C", "Z", "N", "V", "S", "H"];
			}
		},
		"cpc": {},
		"cpi": {
			"format": "4d8k",
			"c": 3,
			"exec": function(c, d, a, k) {
				$scope.update_sreg($scope.RF[d] - k, true, true, true, true, true, true, false, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "C", "Z", "N", "V", "S", "H"];
			}
		},
		"cpse": {},
		"dec": {
			"format": "5d",
			"c": 1194,
			"exec": function(c, d, a, k) {
				$scope.update_sreg($scope.RF[d] - 1, false, true, true, true, true, false, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] - 1, 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "C", "Z", "N", "V", "S"];
			}
		},
		"eicall": {},
		"iejmp": {},
		"elpm": {},
		"eor": {
			"format": "5d5a",
			"c": 9,
			"exec": function(c, d, a, k) {
				$scope.V = 0;
				$scope.update_sreg($scope.RF[d] ^ $scope.RF[a], false, true, true, false, true, false, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] ^ $scope.RF[a], 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "Z", "N", "V", "S"];
			}
		},
		"fmul": {},
		"fmuls": {},
		"fmulsu": {},
		"halt": {  // NOT AN AVR INSTRUCTION
			"format": "n",
			"c": 1,
			"exec": function(c, d, a, k) {
				$scope.end();
			}
		},
		"icall": {},
		"ijmp": {},
		"in": {
			"format": "6a5d",
			"c": 22,
			"exec": function(c, d, a, k) {
				$scope.RF[d] = $scope.truncate($scope.read_IO(a), 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles"];
			}
		},
		"inc": {
			"format": "5d",
			"c": 1187,
			"exec": function(c, d, a, k) {
				$scope.update_sreg($scope.RF[d] + 1, false, true, true, true, true, false, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] + 1, 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "Z", "N", "V", "S"];
			}
		},
		"jmp": {},
		"lat": {},
		"las": {},
		"lac": {},
		"ld": {
			"format": "5dR",
			"c": 32,
			"exec": function(c, d, a, k) {
				var reg = 0;
				if (k == "X" || k == "-X" || k == "X+") reg = 26;
				if (k == "Y" || k == "-Y" || k == "Y+") reg = 28;
				if (k == "Z" || k == "-Z" || k == "Z+") reg = 30;
				if (k[0] == "-") {
					$scope.updated.push(reg);
					$scope.dec_ptr(reg);
				}
				var ptr = $scope.truncate($scope.RF[reg], 8, false) + 256 * $scope.truncate($scope.RF[reg + 1], 8, false);
				$scope.RF[d] = $scope.truncate($scope.RAM[ptr], 8, false);
				if (k[1] == "+") {
					$scope.updated.push(reg);
					$scope.inc_ptr(reg);
				}
				$scope.ram_updated = [];
				$scope.PC++;
				$scope.cycles += 2;
				$scope.updated = [d, "PC", "cycles"];
			}
		},
		"ldi": {
			"format": "4d8k",
			"c": 14,
			"exec": function(c, d, a, k) {
				$scope.RF[d] = $scope.truncate(k, 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles"];
			}
		},
		"lds": {},
		"lpm": {},
		"lsl": {},
		"lsr": {},
		"mov": {
			"format": "5d5a",
			"c": 11,
			"exec": function(c, d, a, k) {
				$scope.RF[d] = $scope.RF[a];
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles"];
			}
		},
		"movw": {},
		"mul": {},
		"muls": {},
		"mulsu": {},
		"neg": {
			"format": "5d",
			"c": 1185,
			"exec": function(c, d, a, k) {
				$scope.update_sreg(-$scope.RF[d], true, true, true, true, true, true, false, false);
				$scope.RF[d] = $scope.truncate(-$scope.RF[d], 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "C", "Z", "N", "V", "S", "H"];
			}
		},
		"nop": {
			"format": "n",
			"c": 0,
			"exec": function(c, d, a, k) {
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"or": {
			"format": "5d5a",
			"c": 10,
			"exec": function(c, d, a, k) {
				$scope.V = 0;
				$scope.update_sreg($scope.RF[d] | $scope.RF[a], false, true, true, false, true, false, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] | $scope.RF[a], 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "Z", "N", "V", "S"];
			}
		},
		"ori": {
			"format": "4d8k",
			"c": 6,
			"exec": function(c, d, a, k) {
				$scope.V = 0;
				$scope.update_sreg($scope.RF[d] | k, false, true, true, false, true, false, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] | k, 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "Z", "N", "V", "S"];
			}
		},
		"out": {
			"format": "5d6a",
			"c": 23,
			"exec": function(c, d, a, k) {
				k = a;
				a = d;
				d = k;
				$scope.write_IO(a, $scope.RF[d]);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles"];
			}
		},
		"pop": {
			"format": "5d",
			"c": 1167,
			"exec": function(c, d, a, k) {
				$scope.incSP();
				var SP = $scope.SPH * 256 + $scope.SPL;
				$scope.RF[d] = $scope.truncate($scope.RAM[SP], 8, false);
				$scope.PC++;
				$scope.cycles += 2;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "SPH", "SPL"];
			}
		},
		"push": {
			"format": "5d",
			"c": 1183,
			"exec": function(c, d, a, k) {
				var SP = $scope.SPH * 256 + $scope.SPL;
				$scope.RAM[SP] = $scope.RF[d];
				$scope.decSP();
				$scope.PC++;
				$scope.cycles += 2;
				$scope.ram_updated = [SP];
				$scope.updated = ["PC", "cycles", "SPH", "SPL"];
			}
		},
		"rcall": {
			"format": "12k",
			"c": 13,
			"exec": function(c, d, a, k) {
				$scope.PC++;
				var PCL = $scope.PC % 256;
				var PCH = Math.floor($scope.PC / 256);
				var SP = $scope.SPH * 256 + $scope.SPL;
				$scope.RAM[SP] = PCH;
				$scope.decSP();
				var SP = $scope.SPH * 256 + $scope.SPL;
				$scope.RAM[SP] = PCL;
				$scope.decSP();
				$scope.PC = $scope.truncate($scope.PC + k, 16, false);
				$scope.cycles += 3;
				$scope.ram_updated = [SP];
				$scope.updated = ["PC", "cycles", "SPH", "SPL"];
			}
		},
		"ret": {
			"format": "n",
			"c": 38152,
			"exec": function(c, d, a, k) {
				$scope.incSP();
				var SP = $scope.SPH * 256 + $scope.SPL;
				var PCL = $scope.RAM[SP];
				$scope.incSP();
				var SP = $scope.SPH * 256 + $scope.SPL;
				var PCH = $scope.RAM[SP];
				$scope.PC = PCL + 256 * PCH;
				$scope.cycles += 4;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "SPH", "SPL"];
			}
		},
		"reti": {},
		"rjmp": {
			"format": "12k",
			"c": 12,
			"exec": function(c, d, a, k) {
				$scope.ram_updated = [];
				$scope.PC = $scope.truncate($scope.PC + k + 1, 16, false);
				$scope.cycles += 2;
				$scope.updated = ["PC", "cycles"];
			}
		},
		"rol": {},
		"ror": {},
		"sbc": {
			"format": "5d5a",
			"c": 2,
			"exec": function(c, d, a, k) {
				var oldC = $scope.C;
				$scope.update_sreg($scope.RF[d] - $scope.RF[a] - oldC, true, true, true, true, true, true, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] - $scope.RF[a] - oldC, 8, false);
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = [d, "PC", "cycles", "C", "Z", "N", "V", "S", "H"];
			}
		},
		"sbci": {},
		"sbi": {},
		"sbic": {},
		"sbis": {},
		"sbiw": {},
		"sbr": {},
		"sbrc": {},
		"sec": {
			"format": "n",
			"c": 37896,
			"exec": function(c, d, a, k) {
				$scope.C = 1;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "C"];
			}
		},
		"seh": {
			"format": "n",
			"c": 37976,
			"exec": function(c, d, a, k) {
				$scope.H = 1;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "H"];
			}
		},
		"sei": {
			"format": "n",
			"c": 38008,
			"exec": function(c, d, a, k) {
				$scope.I = 1;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "I"];
			}
		},
		"sen": {
			"format": "n",
			"c": 37928,
			"exec": function(c, d, a, k) {
				$scope.N = 1;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "N"];
			}
		},
		"ser": {},
		"ses": {
			"format": "n",
			"c": 37960,
			"exec": function(c, d, a, k) {
				$scope.S = 1;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "S"];
			}
		},
		"set": {
			"format": "n",
			"c": 37992,
			"exec": function(c, d, a, k) {
				$scope.T = 1;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "T"];
			}
		},
		"sev": {
			"format": "n",
			"c": 37944,
			"exec": function(c, d, a, k) {
				$scope.V = 1;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "V"];
			}
		},
		"sez": {
			"format": "n",
			"c": 37912,
			"exec": function(c, d, a, k) {
				$scope.Z = 1;
				$scope.PC++;
				$scope.cycles++;
				$scope.ram_updated = [];
				$scope.updated = ["PC", "cycles", "Z"];
			}
		},
		"sleep": {},
		"spm": {},
		"st": {
			"format": "R5d",
			"c": 33,
			"exec": function(c, d, a, k) {
				k = d;
				d = a;
				var reg = 0;
				if (k == "X" || k == "-X" || k == "X+") reg = 26;
				if (k == "Y" || k == "-Y" || k == "Y+") reg = 28;
				if (k == "Z" || k == "-Z" || k == "Z+") reg = 30;
				if (k[0] == "-") {
					$scope.updated.push(reg);
					$scope.dec_ptr(reg);
				}
				var ptr = $scope.truncate($scope.RF[reg], 8, false) + 256 * $scope.truncate($scope.RF[reg + 1], 8, false);
				$scope.ram_updated = [ptr];
				$scope.RAM[ptr] = $scope.RF[d];
				$scope.PC++;
				$scope.cycles += 2;
				if (k[1] == "+") {
					$scope.updated.push(reg);
					$scope.inc_ptr(reg);
				}
				$scope.updated = ["PC", "cycles"];
			}
		},
		"sts": {},
		"sub": {
			"format": "5d5a",
			"c": 6,
			"exec": function(c, d, a, k) {
				$scope.update_sreg($scope.RF[d] - $scope.RF[a], true, true, true, true, true, true, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] - $scope.RF[a], 8, false);
				$scope.ram_updated = [];
				$scope.PC++;
				$scope.cycles++;
				$scope.updated = [d, "PC", "cycles", "C", "Z", "N", "V", "S", "H"];
			}
		},
		"subi": {
			"format": "4d8k",
			"c": 5,
			"exec": function(c, d, a, k) {
				$scope.update_sreg($scope.RF[d] - k, true, true, true, true, true, true, false, false);
				$scope.RF[d] = $scope.truncate($scope.RF[d] - k, 8, false);
				$scope.ram_updated = [];
				$scope.PC++;
				$scope.cycles++;
				$scope.updated = ["PC", "cycles", "C", "Z", "N", "V", "S", "H"];
			}
		},
		"swap": {},
		"tst": {},
		"wdr": {},
		"xch": {}
	};
	$scope.io_switch = function(i) {
		if ($scope.io_state.switch_state[i] == "ON") {
			$scope.io_state.switch_state[i] = "OFF";
			$scope.PIND &= ~(1 << i);
		} else if ($scope.io_state.switch_state[i] == "OFF") {
			$scope.io_state.switch_state[i] = "ON";
			$scope.PIND |= 1 << i;
		}
		$scope.PIND = $scope.PIND & ~$scope.DDRD;
	}
	$scope.output = function() {
		var out_val = $scope.PORTD;
		$scope.outputs.push(out_val);
		//$scope.outputs.push(String.fromCharCode(out_val));
	}
	$scope.initialize = function() {
		$scope.reset_program();
		$scope.cm_setup();
	}
	$scope.end = function() {
		if (!$scope.running) return;
		$scope.running = false;
		setTimeout($scope.cm_setup, 0);
	}
	$scope.reset(true);
	$scope.original_program = $scope.program;
	setTimeout($scope.initialize, 0);
})
.directive('simAvr', function() {
	return {
		restrict: 'E',
		scope: {
			program: '=program',
			text: '=',
			control: '=',
			size: '@size',
			lightboard_feature: '@lightboard',
			reset_feature: '@reset',
			simid: '@simid',
			debug_mode_feature: '@debug'
		},
		templateUrl: function(element, attrs) {
			return attrs.template;
		},
		controller: 'AvrSimController',
		link: function(scope, element, attrs) {
			scope.debug_log = scope.debug_mode_feature == 'yes' ? console.log.bind(console) : scope.do_nothing;
			if (scope.control) {
				scope.control.set_program = function(new_prog) {
					scope.change_program(new_prog);
				}
				scope.control.get_program = function() {
					if (scope.editor) scope.program = scope.editor.getValue();
					return scope.program;
				}
				scope.control.get_PM = function(addr) {
					return scope.PM[addr].encoding;
				}
				scope.control.get_RF = function() {
					return scope.RF;
				}
				scope.control.get_RAM = function(addr) {
					return scope.RAM[addr];
				}
				scope.control.get_other = function() {
					return {
						"PC": scope.PC,
						"C": scope.C,
						"Z": scope.Z,
						"N": scope.N,
						"V": scope.V,
						"S": scope.S,
						"H": scope.H,
						"T": scope.T,
						"I": scope.I,
						"DDRD": scope.DDRD,
						"PIND": scope.PIND,
						"PORTD": scope.PORTD,
						"SPL": scope.SPL,
						"SPH": scope.SPH
					}
				}
				if (scope.control.linked) scope.control.linked();
				else scope.$emit("jsavr_linked");
			}
		}
	}
});