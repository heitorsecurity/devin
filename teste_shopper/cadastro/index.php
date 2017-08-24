<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <link   href="css/bootstrap.min.css" rel="stylesheet">
    <script src="js/bootstrap.min.js"></script>
</head>

<body>
    <div class="container">
            <div class="row">
                <h3>PHP CRUD Cadastro</h3>
            </div>
            <div class="row">
              <p>
                    <a href="cadastrar.php" class="btn btn-success">Cadastrar</a>
                </p>
                <table class="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Idade</th>
                      <th>RG</th>
                      <th>Endereco</th>
                      <th>CEP</th>
                    </tr>
                  </thead>
                  <tbody>
                  <?php
                   include 'database.php';
                   $pdo = Database::connect();
                   $sql = 'SELECT * FROM usuarios ORDER BY id DESC';
                   foreach ($pdo->query($sql) as $row) {
                            echo '<tr>';
                            echo '<td>'. $row['nome'] . '</td>';
                            echo '<td>'. $row['idade'] . '</td>';
                            echo '<td>'. $row['rg'] . '</td>';
                            echo '<td>'. $row['endereco'] . '</td>';
                            echo '<td>'. $row['cep'] . '</td>';
                            echo '<td width=250>';
                            echo '<a class="btn" href="visualizar.php?id='.$row['id'].'">Visualizar</a>';
                            echo ' ';
                            echo '<a class="btn btn-success" href="atualizar.php?id='.$row['id'].'">Atualizar</a>';
                            echo ' ';
                            echo '<a class="btn btn-danger" href="apagar.php?id='.$row['id'].'">Apagar</a>';
                            echo '</td>';
                            echo '</tr>';
                   }
                   Database::disconnect();
                  ?>
                  </tbody>
            </table>
        </div>
    </div> <!-- /container -->
  </body>
</html>
