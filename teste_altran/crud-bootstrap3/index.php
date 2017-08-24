<?php
include_once 'dbconfig.php';
?>
<?php include_once 'header.php'; ?>

<div class="clearfix"></div>
<div class="container">
      <div class="col-md-5">
          <h2>Pedido</h2>
</div>
<div class="clearfix"></div><br />

<div class="container">
     <table class='table table-bordered table-responsive'>
     <tr>
     <th>ID Pedido</th>
     <th>Nome Produto</th>
     <th>Cliente/Nome</th>
     <th>Cliente/E-mail</th>
     <th>Cliente/Telefone</th>
     <th colspan="3" align="center">Acoes</th>
     </tr>
     <?php
      $query = "SELECT * FROM tbl_users";       
      $records_per_page=10;
      $newquery = $crud->paging($query,$records_per_page);
      $crud->dataview($newquery);
      ?>
    <tr>
        <td colspan="8" align="center">
    <div class="pagination-wrap">
            <?php $crud->paginglink($query,$records_per_page); ?>
         </div>
        </td>
    </tr>
 
</table>
   
       
</div>

<?php include_once 'footer.php'; ?>