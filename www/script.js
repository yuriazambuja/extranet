
	var database = {};
	var _loading_ = 0;

	function loading(_test_){
		if(_test_){
			_loading_++;	
		}else{
			_loading_--;
		}
		if(_loading_){
			$('body').addClass("loading");
		}else{
			$('body').removeClass("loading");
		}
	}


	function makeurl(index,query){
		return "http://extranet.mpl.com.br/"+ index + (query?'?'+query:'');
	}

	function query(obj){
		url = [];
		for(i in obj){
			url.push(encodeURIComponent(i)+"="+encodeURIComponent(obj[i]));
		}
		return url.join('&');	
	}

	function request(get,post,callback){
		var connection;
		loading(true);
		if(window.XDomainRequest){
			connection = new window.XDomainRequest();
		}else if(window.ActiveXObject){
			try{
				connection = new ActiveXObject("Msxml2.XMLHTTP");
			}catch(e){
				connection = new ActiveXObject("Microsoft.XMLHTTP");
			}
		}else{
			connection = new XMLHttpRequest();
		}
		connection.responseType = 'blob';
		connection.onreadystatechange=function(){
			if(connection.readyState==4){
				loading(false);
				callback(this);
			}
		};
		connection.open(post?"POST":"GET",get);
		if(post){
			connection.setRequestHeader("content-type","application/x-www-form-urlencoded;charset=iso-8859-1");
			connection.overrideMimeType('text/xml; charset=iso-8859-1');
		}
		connection.send(post?post:null);
		return true;
	}

	function autentica(user,pswd){
		request(makeurl("verificalogin.asp"),query({login:user,senha:pswd}),function(obj){
			if(obj.responseURL==makeurl("menuPrincipal.asp")){
				cliente();
			}else{
				alert("DADOS INVÁLIDOS");
			}
		});
	}

	function cliente(){
		$('#cliente').empty();
		$('#cliente').prop('disabled',true);
		$('#projeto').prop('disabled',true);
		$('#atendimento').prop('disabled',true);
		request(makeurl("clientes.asp"),null,function(obj){
			var reader = new FileReader();
			reader.onloadend = function(){
				var regex = /<a [^<>]*href="clientesIncluir\.asp\?id=([^="]*)?"[^<>]*>([^<>]*)?<\/a>/gm;
				var list = reader.result.match(regex);
				$('#cliente').append(new Option());
				vazio = true;
				for(i in list){
					vazio = false;
					var item = list[i].substring(32).replace("</a>","").replace("\" class=\"link1\">","|").split("|");
					$('#cliente').append(new Option(item[1].toUpperCase(),item[0]));
				}
				if(vazio){
					location.hash = "autentica";
				}else{
					location.hash = "listagem";
					$('#cliente').prop('disabled',false);
				}
			};
			reader.readAsBinaryString(obj.response);
		});
	}

	function atendimento(cliente){
		$('#atendimento').empty();
		$('#atendimento').prop('disabled',true);
		if(cliente){
			request(makeurl("atendimentosConsultor.asp"),query({id:cliente}),function(obj){
				var reader = new FileReader();
				reader.onloadend = function(){
					var regex = /<a [^<>]*href="javascript:atualizar\(\d*,[^<>]*>[^<>]*<\/a>/gm;
					var list = reader.result.match(regex);
					$('#atendimento').append(new Option());
					for(i in list){
						var item = list[i].substring(30).replace("</a>","").replace(", 1);\" class=\"link1\">","|").split("|");
						$('#atendimento').append(new Option(item[1],item[0]));
					}
					$('#atendimento').prop('disabled',false);
				};
				reader.readAsBinaryString(obj.response);
			});
		}
	}

	function projeto(cliente){
		$('#projeto').empty();
		$('#projeto').prop('disabled',true);
		if(cliente){
			request(makeurl("projetos.asp",query({idCliente:cliente})),query({chxExecucao:true}),function(obj){
				var reader = new FileReader();
				reader.onloadend = function(){
					var regex = /<a [^<>]*href="projetosConsultar\.asp\?idProjeto=([^="]*)?"[^<>]*>([^<>]*)?<\/a>/gm;
					var list = reader.result.match(regex);
					$('#projeto').append(new Option());
					for(i in list){
						var item = list[i].substring(41).replace("</a>","").replace("\" class=\"link1\">","|").split("|");
						$('#projeto').append(new Option(item[1],item[0]));
					}
					$('#projeto').prop('disabled',false);
				};
				reader.readAsBinaryString(obj.response);
			});
		}
	}

	function fase(cliente,projeto){
		formulario(true,query({id_cliente:cliente,idProjeto:projeto,idFase:null}),['#fase','#objeto','#tipo_atendimento','#contato'],
		[database.cmbFase,database.cmbObjetoInc,database.cmbAtividadeInc,database.cmbContatoCliente]);
	}

	function atividade(projeto,fase){
		formulario(false,query({idProjeto:projeto,idFase:fase}),['#atividade','#tipo_atendimento'],[database.cmbAtividadeProjeto,database.cmbAtividadeInc]);
	}

	function formulario(step,parameters,select,values){
		request(makeurl("request_atendimento.asp",parameters),null,function(obj){
			var reader = new FileReader();
			reader.onloadend = function(){
				var tabela = reader.result.split("/DIVISAO/");
				for(i in tabela){
					var disabled = false;
					var selected = $(select[i]).val()?$(select[i]).val():values[i];
					$(select[i]).empty();
					$(select[i]).append(new Option());
					var linha = tabela[i].split("*");
					for(j in linha){
						if(linha[j].trim()){
							var coluna = linha[j].split(",");
							var option = new Option(coluna[1],coluna[0]);
							if(coluna[2]){
								selected = coluna[0];
								disabled = true;
							}
							$(select[i]).append(option);
							$(select[i]).prop('disabled',disabled);
						}
					}
					$(select[i]).val(selected);
					if(step&&selected){
						atividade($('#projeto').val(),$('#fase').val());
					}
				}
			};
			reader.readAsBinaryString(obj.response);
		});
	}

	function sair(){
		request(makeurl("logoff.asp"),null,function(obj){
			if(obj.responseURL==makeurl("extranet.htm")){
				location.hash="autentica";
			}else{
				location.hash="listagem";
			}
		});
	}

	function conteudo(cliente,id){
		request(makeurl("atendimentosIncluir.asp"),query({id_cliente:cliente,id:id}),function(obj){
			var reader = new FileReader();
			reader.onloadend = function(){
				var regex = /<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"[^>]*>/gm;
				while (result=regex.exec(reader.result)) {
					if (result.index===regex.lastIndex) {
						regex.lastIndex++;
					}
					database[result[1]] = result[2];
				}
				var regex = /<textarea[^>]*name="([^"]*)"[^>]*>([^<]*)<\/textarea>/gm;
				while (result=regex.exec(reader.result)) {
					if (result.index===regex.lastIndex) {
						regex.lastIndex++;
					}
					database[result[1]] = result[2];
				}
				var regex = /<select[^>]*name="([^"]*)".*>(?:[^<]*<option(?![^>]*selected).*)*[^<]*(?:<option[^>]*value="([^"]*)"[^>]*>)?/gm;
				while (result=regex.exec(reader.result)) {
					if (result.index===regex.lastIndex) {
						regex.lastIndex++;
					}
					database[result[1]] = result[2];
				}
				if(database.cmbProjeto){
					$('#projeto').val(database.cmbProjeto);
					fase($('#cliente').val(),$('#projeto').val());
				}
				if(database.txtDescSumaria){
					$('#resumo').val(database.txtDescSumaria);
				}
				if(database.txtDescCompleta){
					$('#descricao').val(database.txtDescCompleta);
				}
				if(database.cmbTipoHora){
					$('#tipo_hora').val(database.cmbTipoHora);
				}
				if(database.cmbTipo){
					$('#tipo').val(database.cmbTipo);
				}
				if(database.cmbStatus){
					$('#status').val(database.cmbStatus);
				}
				if(database.txtHoraInicial){
					$('#hora').val(database.txtHoraInicial);
				}
				if(database.txtDuracaoHoras){
					$('#duracao').val(database.txtDuracaoHoras);
				}
				if(database.textoDataInicial){
					$('#data').val(database.textoDataInicial.split('/').reverse().join('-'));
				}
			};
			reader.readAsBinaryString(obj.response);
		});
	}

	function combo(select,option){
		$(select).empty();
		$(select).append(new Option());
		for(i in option){
			$(select).append(new Option(option[i].text,option[i].id));	
		}
	}

	$(document).ready(function(){
		$('#validar').click(function(){
			autentica($('#usuario').val(),$('#senha').val());
		});
		$('#cliente').change(function(){
			projeto($('#cliente').val());
			atendimento($('#cliente').val());
		});
		$('#projeto').change(function(){
			fase($('#cliente').val(),$('#projeto').val());
			location.hash = "formulario";
		});
		$('#fase').change(function(){
			atividade($('#projeto').val(),$('#fase').val());
		});
		$('#atendimento').change(function(){
			conteudo($('#cliente').val(),$('#atendimento').val());
			location.hash = "formulario";
		});
		combo('#status',[{id:"E",text:"Em Execução"},{id:"T",text:"Atendido"}]);
		combo('#tipo',[{text:"Investimento",id:"I"},{text:"Produtivo",id:"P"}]);
		combo('#tipo_hora',[{id:1,text:"Hora Normal"},{id:2,text:"Hora Extra"},{id:3,text:"Hora Compensação"},{id:5,text:"Férias"},{id:6,text:"Falta"},{id:7,text:"Atraso"},{id:8,text:"Falta com Atestado"},{id:9,text:"Licença Maternidade"},{id:10,text:"Licença Paternidade"},{id:11,text:"Licença Matrimônio"}]);
		cliente();
	});
	$(window).on('hashchange',function(){
		if(location.hash=="#listagem"){
			$('#projeto').empty();
			$('#projeto').prop('disabled',true);
			$('#atendimento').empty();
			$('#atendimento').prop('disabled',true);
			$('input').val('');
			$('select').val('');
		}
		if(location.hash=="#desconecta"){
			sair();
		}
	});




/*

txtIdAtend=292150&
cmbProjeto=1503&
txtIdCliente=UAE&
id=UAE&
campoOrdenacao=&
cmbResponsavel=&
cmbAtividade=&
pagina=atendimentosConsultor.asp&
pageNumber=1&
txtDataInicial=&
txtDataFinal=&
chamado=&
closeWindow=&
operacao=ATUALIZAR&
pag=&
data_cadastro=20190311&
cmbColaborador=yuri.azambuja&
cmbFase=11&
cmbAtividadeProjeto=1&
cmbAtividadeInc=14&
cmbObjetoInc=145&
txtDescSumaria=Fluxo+de+Caixa+-+Pedido+Guarda-Chuva&
txtDescCompleta=Fluxo+de+Caixa+-+Pedido+Guarda-Chuva&
textoDataInicial=11%2F03%2F2019&
txtHoraInicial=09%3A00&
cmbTipoHora=1&
txtDuracaoHoras=08%3A00&
hh_dia_col=0&
fl_autorizado=0&
cmbTipo=P&
cmbStatus=T&
cmbContatoCliente=anderson.cunha&
radAprovado=&
txtObsClienteAtend=&
btnSubmit=++Atualizar++

*/