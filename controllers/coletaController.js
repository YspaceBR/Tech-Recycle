const conn = require("../config/db");

exports.agendarColeta = async (req, res) => {
  try {
    const { data, material, peso, observacao, usarCadastro, local } = req.body;

    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      return res.status(401).send('Usuário não autenticado');
    }
    const idUsuario = req.session.usuario.id;

    if (!data) {
      return res.status(400).send('Data não informada');
    }
    if (!material) {
      return res.status(400).send('Material não informado');
    }

    const coletaQuery = 'INSERT INTO Coleta (Data, ID_Usuario, Local) VALUES (?, ?, ?)';
    const [coletaResult] = await conn.promise().query(coletaQuery, [data, idUsuario, local]);

    const idColeta = coletaResult.insertId;
    console.log('✅ Nova coleta criada com ID:', idColeta);

    const dispositivoQuery = 'INSERT INTO Dispositivo (Tipo, ID_Coleta, ID_Usuario, Peso) VALUES (?, ?, ?, ?)';
    await conn.promise().query(dispositivoQuery, [material, idColeta, idUsuario, peso || null]);

    if (observacao) {
      const obsQuery = 'UPDATE Coleta SET Observacao = ? WHERE ID_Coleta = ?';
      await conn.promise().query(obsQuery, [observacao, idColeta]);
    }

    // Redireciona para a página agenda com o idColeta na URL
    res.redirect(`/agenda?idColeta=${idColeta}`);
  } catch (error) {
    console.error('Erro ao inserir agendamento:', error);
    res.status(500).send('Erro ao salvar agendamento');
  }
};


// Nova função para cancelar coleta
exports.cancelarColeta = async (req, res) => {
  try {
    let { idColeta } = req.body;
    
    // Garantir que idColeta seja um número
    idColeta = parseInt(idColeta);
    
    console.log('➡️ ID recebido para cancelamento:', idColeta);

    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não autenticado' });
    }

    const idUsuario = req.session.usuario.id;
    console.log('🔐 ID do usuário logado:', idUsuario);

    // Verificar se a coleta existe (independente do usuário)
    const checkColetaQuery = 'SELECT ID_Coleta, ID_Usuario FROM Coleta WHERE ID_Coleta = ?';
    const [coletaCheck] = await conn.promise().query(checkColetaQuery, [idColeta]);
    
    if (coletaCheck.length === 0) {
      console.log('🔍 Coleta com ID', idColeta, 'não existe no banco de dados');
      return res.status(404).json({ 
        sucesso: false, 
        mensagem: 'Coleta não encontrada' 
      });
    } else if (coletaCheck[0].ID_Usuario !== idUsuario) {
      console.log('🔍 Coleta encontrada, mas pertence ao usuário:', coletaCheck[0].ID_Usuario);
      return res.status(403).json({ 
        sucesso: false, 
        mensagem: 'Você não tem permissão para cancelar esta coleta' 
      });
    }

    console.log('✅ Coleta pertence ao usuário. Prosseguindo com exclusão.');

    // Primeiro exclui da tabela Dispositivo
    const deleteDispositivoQuery = 'DELETE FROM Dispositivo WHERE ID_Coleta = ?';
    await conn.promise().query(deleteDispositivoQuery, [idColeta]);
    console.log('🗑️ Dispositivo excluído com sucesso.');

    // Depois exclui da tabela Coleta
    const deleteColetaQuery = 'DELETE FROM Coleta WHERE ID_Coleta = ?';
    await conn.promise().query(deleteColetaQuery, [idColeta]);
    console.log('🗑️ Coleta excluída com sucesso.');

    return res.json({ sucesso: true, mensagem: 'Coleta cancelada com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao cancelar coleta:', error.message || error);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cancelar coleta' });
  }
};
