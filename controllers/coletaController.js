// controllers/coletaController.js

const conn = require("../config/db");

// Função existente de agendamento
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

// Nova função para cancelar coleta
exports.cancelarColeta = async (req, res) => {
  try {
    // Obter o ID da coleta do corpo da requisição
    const { idColeta } = req.body;
    
    // Verificar se o usuário está autenticado
    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não autenticado' });
    }
    
    const idUsuario = req.session.usuario.id;
    
    // Verificar se a coleta pertence ao usuário
    const verificaQuery = 'SELECT ID_Coleta FROM Coleta WHERE ID_Coleta = ? AND ID_Usuario = ?';
    const [rows] = await conn.promise().query(verificaQuery, [idColeta, idUsuario]);
    
    if (rows.length === 0) {
      return res.status(403).json({ 
        sucesso: false, 
        mensagem: 'Você não tem permissão para cancelar esta coleta ou ela não existe' 
      });
    }
    
    // Primeiro excluímos os registros na tabela Dispositivo
    const deleteDispositivoQuery = 'DELETE FROM Dispositivo WHERE ID_Coleta = ?';
    await conn.promise().query(deleteDispositivoQuery, [idColeta]);
    
    // Depois excluímos o registro na tabela Coleta
    const deleteColetaQuery = 'DELETE FROM Coleta WHERE ID_Coleta = ?';
    await conn.promise().query(deleteColetaQuery, [idColeta]);
    
    // Retorna sucesso
    return res.json({ sucesso: true, mensagem: 'Coleta cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar coleta:', error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cancelar coleta' });
  }
};