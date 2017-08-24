<?php
    require 'database.php';
    $id = null;
    if ( !empty($_GET['id'])) {
        $id = $_REQUEST['id'];
    }

    if ( null==$id ) {
        header("Location: index.php");
    } else {
        $pdo = Database::connect();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $sql = "SELECT * FROM usuarios where id = ?";
        $q = $pdo->prepare($sql);
        $q->execute(array($id));
        $data = $q->fetch(PDO::FETCH_ASSOC);
        Database::disconnect();
    }
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <link   href="css/bootstrap.min.css" rel="stylesheet">
    <script src="js/bootstrap.min.js"></script>
</head>

<body>
    <div class="container">

                <div class="span10 offset1">
                    <div class="row">
                        <h3>Lendo um cadastro</h3>
                    </div>

                    <div class="form-horizontal" >
                      <div class="control-group">
                        <label class="control-label">Nome</label>
                        <div class="controls">
                            <label class="checkbox">
                                <?php echo $data['nome'];?>
                            </label>
                        </div>
                      </div>
                      <div class="control-group">
                        <label class="control-label">Idade</label>
                        <div class="controls">
                            <label class="checkbox">
                                <?php echo $data['idade'];?>
                            </label>
                        </div>
                      </div>
                      <div class="control-group">
                        <label class="control-label">RG</label>
                        <div class="controls">
                            <label class="checkbox">
                                <?php echo $data['rg'];?>
                            </label>
                        </div>
                      </div>
                      <div class="control-group">
                        <label class="control-label">Endereco</label>
                        <div class="controls">
                            <label class="checkbox">
                                <?php echo $data['endereco'];?>
                            </label>
                        </div>
                      </div>
                      <div class="control-group">
                        <label class="control-label">CEP</label>
                        <div class="controls">
                            <label class="checkbox">
                                <?php echo $data['cep'];?>
                            </label>
                        </div>
                      </div>
                        <div class="form-actions">
                          <a class="btn" href="index.php">Voltar</a>
                       </div>


                    </div>
                </div>

    </div> <!-- /container -->
  </body>
</html>
