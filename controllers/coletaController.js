const conn = require("../config/db");

// Controller de coleta
exports.agendarColeta = async (req, res) => {
  const {
    data,
    material,
    peso,
    observacao,
    usarCadastro,
    local
  } = req.body;

  const idUsuario = req.session.usuario.id;

  if (!local) {
    return res.status(400).send('Local de coleta não informado');
  }

  conn.query('SELECT ID_Empresa FROM Empresa WHERE NomeEmpresa = ?', [local], async (err, results) => {
    if (err) {
      console.error('Erro ao buscar empresa:', err);
      return res.status(500).send('Erro ao buscar empresa');
    }

    if (results.length === 0) {
      return res.status(400).send('Empresa não encontrada');
    }

    const idEmpresa = results[0].ID_Empresa;

    try {
      // Debug: Verifique os valores antes de inserir
      console.log(`Data: ${data}, ID_Usuario: ${idUsuario}, ID_Empresa: ${idEmpresa}`);

      const coletaQuery = 'INSERT INTO Coleta (Data, ID_Usuario, ID_Empresa) VALUES (?, ?, ?)';
      const [coletaResult] = await conn.promise().query(coletaQuery, [data, idUsuario, idEmpresa]);

      const idColeta = coletaResult.insertId; // Pega o ID da coleta inserida

      const dispositivoQuery = 'INSERT INTO Dispositivo (Tipo, ID_Coleta, ID_Usuario) VALUES (?, ?, ?)';
      await conn.promise().query(dispositivoQuery, [material, idColeta, idUsuario]);

      res.redirect('/principal');
    } catch (err) {
      console.error('Erro ao inserir agendamento ou dispositivo:', err);
      res.status(500).send('Erro ao salvar agendamento');
    }
  });
};