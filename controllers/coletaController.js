const conn = require("../config/db");

exports.agendarColeta = async (req, res) => {
  try {
    const { data, material, peso, observacao, usarCadastro, local } = req.body;
    
    console.log('📝 Dados recebidos para agendamento:', req.body);
    
    // Verificar autenticação
    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'Usuário não autenticado' 
      });
    }
    
    const idUsuario = req.session.usuario.id;
    console.log('🔐 ID do usuário:', idUsuario);
    
    // Validações obrigatórias
    if (!data) {
      console.log('❌ Data não informada');
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Data é obrigatória' 
      });
    }
    
    if (!material) {
      console.log('❌ Material não informado');
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Material é obrigatório' 
      });
    }
    
    // Validar formato da data (YYYY-MM-DD)
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dataRegex.test(data)) {
      console.log('❌ Formato de data inválido:', data);
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Formato de data inválido. Use YYYY-MM-DD' 
      });
    }
    
    // Verificar se a data não é no passado
    const hoje = new Date();
    const dataColeta = new Date(data);
    
    hoje.setHours(0, 0, 0, 0);
    dataColeta.setHours(0, 0, 0, 0);
    
    if (dataColeta < hoje) {
      console.log('❌ Data no passado:', data);
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Não é possível agendar para uma data no passado' 
      });
    }
    
    // Verificar se já existe agendamento para o mesmo usuário e data
    const checkQuery = 'SELECT ID_Coleta FROM Coleta WHERE ID_Usuario = ? AND Date(Data) = ?';
    const [existing] = await conn.promise().query(checkQuery, [idUsuario, data]);
    
    if (existing.length > 0) {
      console.log('❌ Já existe agendamento para esta data');
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Você já possui um agendamento para esta data' 
      });
    }
    
    // Inserir nova coleta
    const coletaQuery = 'INSERT INTO Coleta (Data, ID_Usuario, Local, Observacao) VALUES (?, ?, ?, ?)';
    const [coletaResult] = await conn.promise().query(coletaQuery, [
      data, 
      idUsuario, 
      local || 'Endereço cadastrado', 
      observacao || null
    ]);
    
    const idColeta = coletaResult.insertId;
    console.log('✅ Nova coleta criada com ID:', idColeta);
    
    // Inserir dispositivo/material
    const dispositivoQuery = 'INSERT INTO Dispositivo (Tipo, ID_Coleta, ID_Usuario, Peso) VALUES (?, ?, ?, ?)';
    await conn.promise().query(dispositivoQuery, [
      material, 
      idColeta, 
      idUsuario, 
      peso || null
    ]);
    
    console.log('✅ Dispositivo inserido com sucesso');
    
    // Retornar sucesso com todos os dados necessários
    const agendamentoCompleto = {
      idColeta,
      data,
      material,
      local: local || 'Endereço cadastrado',
      peso,
      observacao,
      status: 'agendado'
    };
    
    console.log('✅ Agendamento criado com sucesso:', agendamentoCompleto);
    
    // Retornar JSON com os dados para o frontend processar
    return res.status(200).json({ 
      sucesso: true, 
      mensagem: 'Agendamento realizado com sucesso',
      agendamento: agendamentoCompleto
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro interno do servidor ao criar agendamento' 
    });
  }
};

// Função para buscar agendamento do usuário
exports.buscarAgendamento = async (req, res) => {
  try {
    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'Usuário não autenticado' 
      });
    }
    
    const idUsuario = req.session.usuario.id;
    
    // Buscar agendamento ativo do usuário (SEM a coluna Observacao)
    const query = `
      SELECT 
        c.ID_Coleta as idColeta,
        c.Data as data,
        c.Local as local,
        d.Tipo as material,
        d.Peso as peso
      FROM Coleta c
      LEFT JOIN Dispositivo d ON c.ID_Coleta = d.ID_Coleta
      WHERE c.ID_Usuario = ? 
      AND c.Data >= CURDATE()
      ORDER BY c.Data ASC
      LIMIT 1
    `;
    
    const [result] = await conn.promise().query(query, [idUsuario]);
    
    if (result.length > 0) {
      const agendamento = result[0];
      
      // Formatar data para DD/MM/YYYY para exibição
      const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');
      
      const agendamentoFormatado = {
        ...agendamento,
        data: agendamento.data,
        dataExibicao: dataFormatada,
        observacao: null // Sempre null já que não temos a coluna
      };
      
      return res.json({ 
        sucesso: true, 
        agendamento: agendamentoFormatado 
      });
    } else {
      return res.json({ 
        sucesso: false, 
        mensagem: 'Nenhum agendamento encontrado' 
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar agendamento:', error);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao buscar agendamento' 
    });
  }
};

// Função melhorada para cancelar coleta
exports.cancelarColeta = async (req, res) => {
  try {
    let { idColeta } = req.body;
    
    // Garantir que idColeta seja um número
    idColeta = parseInt(idColeta);
    
    console.log('➡️ ID recebido para cancelamento:', idColeta);
    console.log('📋 Body completo:', req.body);
    
    // Verificar se ID é válido
    if (!idColeta || isNaN(idColeta)) {
      console.log('❌ ID da coleta inválido');
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'ID da coleta inválido' 
      });
    }
    
    // Verificar autenticação
    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      console.log('❌ Usuário não autenticado');
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'Usuário não autenticado' 
      });
    }
    
    const idUsuario = req.session.usuario.id;
    console.log('🔐 ID do usuário logado:', idUsuario);
    
    // Verificar se a coleta existe e pertence ao usuário
    const checkColetaQuery = `
      SELECT 
        c.ID_Coleta, 
        c.ID_Usuario, 
        c.Data,
        c.Local,
        d.Tipo as material
      FROM Coleta c
      LEFT JOIN Dispositivo d ON c.ID_Coleta = d.ID_Coleta
      WHERE c.ID_Coleta = ?
    `;
    const [coletaCheck] = await conn.promise().query(checkColetaQuery, [idColeta]);
    
    if (coletaCheck.length === 0) {
      console.log('🔍 Coleta com ID', idColeta, 'não existe no banco de dados');
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Coleta não encontrada'
      });
    }
    
    const coleta = coletaCheck[0];
    
    if (coleta.ID_Usuario !== idUsuario) {
      console.log('🔍 Coleta encontrada, mas pertence ao usuário:', coleta.ID_Usuario);
      return res.status(403).json({
        sucesso: false,
        mensagem: 'Você não tem permissão para cancelar esta coleta'
      });
    }
    
    // Verificar se a coleta não é no passado
    const hoje = new Date();
    const dataColeta = new Date(coleta.Data);
    
    hoje.setHours(0, 0, 0, 0);
    dataColeta.setHours(0, 0, 0, 0);
    
    if (dataColeta < hoje) {
      console.log('❌ Tentativa de cancelar coleta no passado');
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível cancelar uma coleta que já passou'
      });
    }
    
    console.log('✅ Coleta pertence ao usuário. Prosseguindo com exclusão.');
    
    // Iniciar transação para garantir integridade
    await conn.promise().beginTransaction();
    
    try {
      // Primeiro exclui da tabela Dispositivo
      const deleteDispositivoQuery = 'DELETE FROM Dispositivo WHERE ID_Coleta = ?';
      await conn.promise().query(deleteDispositivoQuery, [idColeta]);
      console.log('🗑️ Dispositivos excluídos com sucesso.');
      
      // Depois exclui da tabela Coleta
      const deleteColetaQuery = 'DELETE FROM Coleta WHERE ID_Coleta = ?';
      const [deleteResult] = await conn.promise().query(deleteColetaQuery, [idColeta]);
      
      if (deleteResult.affectedRows === 0) {
        throw new Error('Nenhuma linha foi excluída');
      }
      
      console.log('🗑️ Coleta excluída com sucesso.');
      
      // Confirmar transação
      await conn.promise().commit();
      
      return res.json({ 
        sucesso: true, 
        mensagem: 'Coleta cancelada com sucesso',
        coletaCancelada: {
          id: idColeta,
          data: coleta.Data,
          material: coleta.material,
          local: coleta.Local
        }
      });
      
    } catch (transactionError) {
      // Rollback em caso de erro
      await conn.promise().rollback();
      throw transactionError;
    }
    
  } catch (error) {
    console.error('❌ Erro ao cancelar coleta:', error.message || error);
    return res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro interno do servidor ao cancelar coleta' 
    });
  }
};

// Função para reagendar coleta
exports.reagendarColeta = async (req, res) => {
  try {
    const { idColeta, novaData } = req.body;
    
    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'Usuário não autenticado' 
      });
    }
    
    const idUsuario = req.session.usuario.id;
    
    // Validar nova data
    if (!novaData) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Nova data é obrigatória' 
      });
    }
    
    const hoje = new Date();
    const novaDataColeta = new Date(novaData);
    
    hoje.setHours(0, 0, 0, 0);
    novaDataColeta.setHours(0, 0, 0, 0);
    
    if (novaDataColeta < hoje) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Não é possível reagendar para uma data no passado' 
      });
    }
    
    // Verificar se a coleta existe e pertence ao usuário
    const checkQuery = 'SELECT ID_Usuario FROM Coleta WHERE ID_Coleta = ?';
    const [checkResult] = await conn.promise().query(checkQuery, [idColeta]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({ 
        sucesso: false, 
        mensagem: 'Coleta não encontrada' 
      });
    }
    
    if (checkResult[0].ID_Usuario !== idUsuario) {
      return res.status(403).json({ 
        sucesso: false, 
        mensagem: 'Você não tem permissão para reagendar esta coleta' 
      });
    }
    
    // Atualizar a data
    const updateQuery = 'UPDATE Coleta SET Data = ? WHERE ID_Coleta = ?';
    await conn.promise().query(updateQuery, [novaData, idColeta]);
    
    return res.json({ 
      sucesso: true, 
      mensagem: 'Coleta reagendada com sucesso',
      novaData: novaData
    });
    
  } catch (error) {
    console.error('❌ Erro ao reagendar coleta:', error);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao reagendar coleta' 
    });
  }
};