const conn = require("../config/db");
const { parseISO, format } = require('date-fns');


exports.agendarColeta = async (req, res) => {
  const { data, material, local, peso, observacao } = req.body;
  const idUsuario = req.session?.usuario?.id;

  if (!idUsuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Usuário não autenticado.',
    });
  }

  try {
    const dataFormatada = data.substring(0, 10); 

    const [resultado] = await conn.promise().query(
      `INSERT INTO Coleta (Data, Material, Local, Peso, Observacao, ID_Usuario) VALUES (?, ?, ?, ?, ?, ?)`,
      [dataFormatada, material, local, peso, observacao, idUsuario]
    );


    const idColeta = resultado.insertId;

    await conn.promise().query(
      `INSERT INTO Dispositivo (Tipo, ID_Coleta, ID_Usuario, Peso) VALUES (?, ?, ?, ?)`,
      [material, idColeta, idUsuario, peso]
    );

    const novaColeta = {
      idColeta,
      data: dataFormatada,
      material,
      local,
      peso,
      observacao,
      idUsuario,
    };

    return res.json({
      sucesso: true,
      agendamento: novaColeta,
    });
  } catch (error) {
    console.error('Erro ao agendar coleta:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao tentar agendar coleta.',
    });
  }
};

// Cancelar coleta
exports.cancelarColeta = async (req, res) => {
  try {
    let { idColeta } = req.body;
    idColeta = parseInt(idColeta);

    if (!idColeta || isNaN(idColeta)) {
      return res.status(400).json({ sucesso: false, mensagem: 'ID da coleta inválido' });
    }

    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não autenticado' });
    }

    const idUsuario = req.session.usuario.id;

    // Verificar se a coleta existe e pertence ao usuário
    const [coletaCheck] = await conn.promise().query(`
      SELECT c.ID_Coleta, c.ID_Usuario, c.Data, c.Local, c.Material
      FROM Coleta c
      WHERE c.ID_Coleta = ?
    `, [idColeta]);

    if (coletaCheck.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Coleta não encontrada' });
    }

    const coleta = coletaCheck[0];

    if (coleta.ID_Usuario !== idUsuario) {
      return res.status(403).json({ sucesso: false, mensagem: 'Permissão negada para cancelar esta coleta' });
    }

    // Verificar se não é uma coleta passada
    const hoje = new Date();
    const dataColeta = new Date(coleta.Data);
    hoje.setHours(0, 0, 0, 0);
    dataColeta.setHours(0, 0, 0, 0);

    if (dataColeta < hoje) {
      return res.status(400).json({ sucesso: false, mensagem: 'Não é possível cancelar uma coleta passada' });
    }

    // Iniciar transação
    await conn.promise().beginTransaction();

    try {
      // Excluir dispositivos relacionados (se houver tabela Dispositivo)
      await conn.promise().query('DELETE FROM Dispositivo WHERE ID_Coleta = ?', [idColeta]);
      // Excluir coleta
      const [deleteResult] = await conn.promise().query('DELETE FROM Coleta WHERE ID_Coleta = ?', [idColeta]);

      if (deleteResult.affectedRows === 0) {
        throw new Error('Nenhuma linha foi excluída');
      }

      await conn.promise().commit();

      res.json({
        sucesso: true,
        mensagem: 'Coleta cancelada com sucesso',
        coletaCancelada: {
          id: idColeta,
          data: coleta.Data,
          material: coleta.Material,
          local: coleta.Local
        }
      });

    } catch (transactionError) {
      await conn.promise().rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Erro ao cancelar coleta:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao cancelar coleta' });
  }
};

// Buscar agendamento para página minhas-coletas (renderiza página)
exports.buscarAgendamento = async (req, res) => {
  try {
    const idColeta = req.query.idColeta;
    if (!idColeta) {
      return res.render('auth/minhas-coletas', { agendamento: null, erro: 'Agendamento não encontrado.' });
    }

    const [rows] = await conn.promise().query('SELECT * FROM Coleta WHERE ID_Coleta = ?', [idColeta]);
    const agendamento = rows[0];

    if (!agendamento) {
      return res.render('auth/minhas-coletas', { agendamento: null, erro: 'Agendamento não encontrado.' });
    }

    // Formata a data manualmente para DD/MM/YYYY
    const dataStr = typeof agendamento.Data === 'string'
      ? agendamento.Data.substring(0, 10)
      : agendamento.Data.toISOString().substring(0, 10);
    const [ano, mes, dia] = dataStr.split('-');
    agendamento.dataExibicao = `${dia}/${mes}/${ano}`;

    res.render('auth/minhas-coletas', { agendamento });
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.render('auth/minhas-coletas', { agendamento: null, erro: 'Erro ao buscar agendamento.' });
  }
};

// Buscar agendamento para AJAX (agenda.handlebars)
exports.buscarAgendamentosAPI = async (req, res) => {
  try {
    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      return res.json({ sucesso: false, mensagem: 'Usuário não autenticado.' });
    }
    const idUsuario = req.session.usuario.id;

    // Buscar todas as coletas futuras (ou todas, se quiser)
    const [rows] = await conn.promise().query(
      'SELECT * FROM Coleta WHERE ID_Usuario = ? ORDER BY Data DESC',
      [idUsuario]
    );

    // Formatar datas
    rows.forEach(agendamento => {
      agendamento.idColeta = agendamento.ID_Coleta;
      agendamento.local = agendamento.Local;
      agendamento.material = agendamento.Material;
      agendamento.peso = agendamento.Peso;
      agendamento.data = agendamento.Data;
      // CORREÇÃO: Formatar manualmente
      const dataStr = typeof agendamento.Data === 'string'
        ? agendamento.Data.substring(0, 10)
        : agendamento.Data.toISOString().substring(0, 10);
      const [ano, mes, dia] = dataStr.split('-');
      agendamento.dataExibicao = `${dia}/${mes}/${ano}`;
    });

    res.json({ sucesso: true, agendamentos: rows });
  } catch (error) {
    res.json({ sucesso: false, mensagem: 'Erro ao buscar agendamentos.' });
  }
};

// Reagendar coleta
exports.reagendarColeta = async (req, res) => {
  try {
    // Certifique-se de que o frontend envia: material, peso, observacao
    const { idColeta, novaData, material, peso, observacao } = req.body;

    if (!req.session || !req.session.usuario || !req.session.usuario.id) {
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário não autenticado' });
    }

    const idUsuario = req.session.usuario.id;

    // Validar nova data
    if (!novaData || !/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
      return res.status(400).json({ sucesso: false, mensagem: 'Nova data inválida' });
    }

    const hoje = new Date();
    const dataReagendamento = new Date(novaData);
    hoje.setHours(0, 0, 0, 0);
    dataReagendamento.setHours(0, 0, 0, 0);

    if (dataReagendamento < hoje) {
      return res.status(400).json({ sucesso: false, mensagem: 'Não é possível reagendar para uma data no passado' });
    }

    // Verificar se a coleta existe e pertence ao usuário
    const [checkResult] = await conn.promise().query(
      'SELECT ID_Usuario FROM Coleta WHERE ID_Coleta = ?', [idColeta]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ sucesso: false, mensagem: 'Coleta não encontrada' });
    }

    if (checkResult[0].ID_Usuario !== idUsuario) {
      return res.status(403).json({ sucesso: false, mensagem: 'Permissão negada para reagendar esta coleta' });
    }

    // Verificar se já existe outro agendamento na nova data
    const [existingOnDate] = await conn.promise().query(
      'SELECT ID_Coleta FROM Coleta WHERE ID_Usuario = ? AND Date(Data) = ? AND ID_Coleta != ?',
      [idUsuario, novaData, idColeta]
    );

    if (existingOnDate.length > 0) {
      return res.status(400).json({ sucesso: false, mensagem: 'Você já possui um agendamento para esta data' });
    }

    // Atualizar data, material, peso e observação da coleta
    await conn.promise().query(
      'UPDATE Coleta SET Data = ?, Material = ?, Peso = ?, Observacao = ? WHERE ID_Coleta = ?',
      [novaData, material, peso, observacao, idColeta]
    );

    // CORREÇÃO: Formatar manualmente
    const [ano, mes, dia] = novaData.split('-');
    const dataExibicao = `${dia}/${mes}/${ano}`;

    res.json({ 
      sucesso: true, 
      mensagem: 'Coleta reagendada com sucesso', 
      novaData: novaData,
      novaDataExibicao: dataExibicao
    });

  } catch (error) {
    console.error('Erro ao reagendar coleta:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao reagendar coleta' });
  }
};