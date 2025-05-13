const conn = require("../config/db");

exports.agendarColeta = async (req, res) => {
  try {
    // Pegando os dados do corpo da requisição
    const {
      data,
      material,
      peso,
      observacao,
      usarCadastro,
      local
    } = req.body;
    
    // Verificando se o usuário está logado
    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      return res.status(401).send('Usuário não autenticado');
    }
    
    const idUsuario = req.session.usuario.id;
    
    // Validação dos campos obrigatórios
    if (!data) {
      return res.status(400).send('Data não informada');
    }
    
    if (!material) {
      return res.status(400).send('Material não informado');
    }
    
    // Inserindo na tabela Coleta sem referência à empresa
    const coletaQuery = 'INSERT INTO Coleta (Data, ID_Usuario, Local) VALUES (?, ?, ?)';
    const [coletaResult] = await conn.promise().query(coletaQuery, [data, idUsuario, local]);
    
    const idColeta = coletaResult.insertId; // Pega o ID da coleta inserida
    
    // Insere na tabela de Dispositivo
    const dispositivoQuery = 'INSERT INTO Dispositivo (Tipo, ID_Coleta, ID_Usuario) VALUES (?, ?, ?)';
    await conn.promise().query(dispositivoQuery, [material, idColeta, idUsuario]);
    
    // Se tiver observação, podemos salvar
    if (observacao) {
      const obsQuery = 'UPDATE Coleta SET Observacao = ? WHERE ID_Coleta = ?';
      await conn.promise().query(obsQuery, [observacao, idColeta]);
    }
    
    // Se tiver informação de peso, podemos salvar
    if (peso) {
      const pesoQuery = 'UPDATE Dispositivo SET Peso = ? WHERE ID_Coleta = ?';
      await conn.promise().query(pesoQuery, [peso, idColeta]);
    }
    
    // Redireciona para a página principal
    res.redirect('/principal');
  } catch (error) {
    console.error('Erro ao inserir agendamento:', error);
    res.status(500).send('Erro ao salvar agendamento');
  }
};