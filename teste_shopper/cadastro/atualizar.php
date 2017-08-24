<?php
    require 'database.php';

    $id = null;
    if ( !empty($_GET['id'])) {
        $id = $_REQUEST['id'];
    }

    if ( null==$id ) {
        header("Location: index.php");
    }

    if ( !empty($_POST)) {
        // keep track validation errors
        $nomeError = null;
        $idadeError = null;
        $rgError = null;
        $enderecoError = null;
        $cepError = null;

        // keep track post values
        $nome = $_POST['nome'];
        $idade = $_POST['idade'];
        $rg = $_POST['rg'];
        $endereco = $_POST['endereco'];
        $cep = $_POST['cep'];

        // validate input
        $valid = true;
        if (empty($nome)) {
            $nomeError = 'Por favor coloque seu nome';
            $valid = false;
        }

        if (empty($idade)) {
            $idadeError = 'Coloque sua idade';
            $valid = false;
        }

        if (empty($rg)) {
            $rgError = 'Digite seu RG';
            $valid = false;
        }

        if (empty($endereco)) {
            $enderecoError = 'Preencha seu Endereço';
            $valid = false;
        }

        if (empty($cep)) {
            $cepError = 'Digite seu CEP';
            $valid = false;
        }

        // update data
        if ($valid) {
            $pdo = Database::connect();
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $sql = "UPDATE usuarios set nome = ?, idade = ?, rg =?, endereco =?, cep =? WHERE id = ?";
            $q = $pdo->prepare($sql);
            $q->execute(array($nome,$idade,$rg,$endereco,$cep,$id));
            Database::disconnect();
            header("Location: index.php");
        }
    } else {
        $pdo = Database::connect();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $sql = "SELECT * FROM usuarios where id = ?";
        $q = $pdo->prepare($sql);
        $q->execute(array($id));
        $data = $q->fetch(PDO::FETCH_ASSOC);
        $nome = $data['nome'];
        $idade = $data['idade'];
        $rg = $data['rg'];
        $endereco = $data['endereco'];
        $cep = $data['cep'];
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
                        <h3>Atualizando um cadastro</h3>
                    </div>

                    <form class="form-horizontal" action="atualizar.php?id=<?php echo $id?>" method="post">
                      <div class="control-group <?php echo !empty($nomeError)?'error':'';?>">
                        <label class="control-label">Nome</label>
                        <div class="controls">
                            <input name="nome" type="text"  placeholder="Nome" value="<?php echo !empty($nome)?$nome:'';?>">
                            <?php if (!empty($nomeError)): ?>
                                <span class="help-inline"><?php echo $nomeError;?></span>
                            <?php endif; ?>
                        </div>
                      </div>
                      <div class="control-group <?php echo !empty($idadeError)?'error':'';?>">
                        <label class="control-label">Idade</label>
                        <div class="controls">
                            <input name="idade" type="text"  placeholder="Idade" value="<?php echo !empty($idade)?$idade:'';?>">
                            <?php if (!empty($idadeError)): ?>
                                <span class="help-inline"><?php echo $idadeError;?></span>
                            <?php endif; ?>
                        </div>
                      </div>
                      <div class="control-group <?php echo !empty($rgError)?'error':'';?>">
                        <label class="control-label">RG</label>
                        <div class="controls">
                            <input name="rg" type="text"  placeholder="RG" value="<?php echo !empty($rg)?$rg:'';?>">
                            <?php if (!empty($rgError)): ?>
                                <span class="help-inline"><?php echo $rgError;?></span>
                            <?php endif; ?>
                        </div>
                      </div>
                      <div class="control-group <?php echo !empty($enderecoError)?'error':'';?>">
                        <label class="control-label">Endereço</label>
                        <div class="controls">
                            <input name="endereco" type="text" placeholder="Endereço" value="<?php echo !empty($endereco)?$endereco:'';?>">
                            <?php if (!empty($enderecoError)): ?>
                                <span class="help-inline"><?php echo $enderecoError;?></span>
                            <?php endif;?>
                        </div>
                      </div>
                      <div class="control-group <?php echo !empty($cepError)?'error':'';?>">
                        <label class="control-label">CEP</label>
                        <div class="controls">
                            <input name="cep" type="text"  placeholder="CEP" value="<?php echo !empty($cep)?$cep:'';?>">
                            <?php if (!empty($cepError)): ?>
                                <span class="help-inline"><?php echo $cepError;?></span>
                            <?php endif;?>
                        </div>
                      </div>
                      <div class="form-actions">
                          <button type="submit" class="btn btn-success">Atualizar</button>
                          <a class="btn" href="index.php">Voltar</a>
                        </div>
                    </form>
                </div>

    </div> <!-- /container -->
  </body>
</html>
