Acesse site

Baixe o arquivo RubyInstaller para Mac OS X

.Abra se estiver no Unix ou Mac OS X, va ate o programa Terminal e digite "rails new importandoTABS" para criar sua aplicação em Ruby.

.Entrar na pasta "cd importandoTABS"

.Digitar esta linha inteira "rails g model Compradores comprador:text descriacao:text precoun:float quantidade:integer endereco:text fornecedor:text" para criar sua model para começar o aplicativo.

.No mesmo lugar digitar "rake db:migrate" para migrar seu banco e criá-lo.

.Abrir um editor de código tipo Sublime Text 2 ou TextWrangler, e acessar o arquivo nesta mesma pasta "importandoTABS/app/models/compradore.rb" para editar o arquivo com o codigo abaixo:

>>
	require 'csv'
	
	# um metodo classe é importado, com o arquivo parseado através de um argumento
	def self.import(file)
		# um bloco que roda atraves de um loop no nosso arquivo CSV/TAB
		CSV.foreach(file.path, headers: true) do |row|
		# cria uma chave para cada linha do arquivo importado
		Compradore.create! row.to_hash
		end
	end
>> fim do codigo

.Digitar esta linha inteira "rails g controller Compradore index import" para ter certeza que o metodo mostra para todos os compradores e cria a controller.

.Abrir um editor de código tipo Sublime Text 2 ou TextWrangler, e acessar o arquivo nesta mesma pasta "importandoTABS/app/controller/compradore_controller.rb" para editar o arquivo com o codigo abaixo:

>>
	def index
		@compradore = Compradore.all
	end
	
	def import
		Compradore.import(params[:file])
		# depois de importar, redirecionar e nos mostrar que o método funcionou
		redirect_to root_url, notice: "Arquivo TAB importado!"
	end
>> fim do codigo

.No nosso paradigma MVC não ficará completo sem uma view. Abrir um editor de código tipo Sublime Text 2 ou TextWrangler, e acessar o arquivo nesta mesma pasta "importandoTABS/app/views/compradore/index.html.erb" para editar o arquivo com o codigo abaixo:

>>
<h1>Compradore#index</h1>
<% flash[:notice] %>
<table>
	<thead>
		<tr>
			<th>Comprador</th>
			<th>Descricao</th>
			<th>Preco Unitario</th>
			<th>Quantidade</th>
			<th>Endereco</th>
			<th>Fornecedor</th>
		</tr>
	</thead>
	<tbody>
		<% @compradore.each do |comprador| %>
			<tr>
				<td><%= comprador.comprador %></td>
				<td><%= comprador.descriacao %></td>
				<td><%= comprador.precoun %></td>
				<td><%= comprador.quantidade %></td>
				<td><%= comprador.endereco %></td>
				<td><%= comprador.fornecedor %></td>
			</tr>
		<% end %>
	</tbody>
</table>
<div>

<h4>Importar isso!</h4>
	<%= form_tag import_comprador_path, multipart: true do %>
		<%= file_field_tag :file %>
		<%= submit_tag "Importar arquivo" %>
	<% end %>
</div>
<p>Find me in app/views/compradore/index.html.erb</p>
>> fim do codigo

.Finalmente para renderizar a view corretamente, precisamos configurar as rotas. Iremos configurar as rotas para o comprador e para a página inicial. Abrir um editor de código tipo Sublime Text 2 ou TextWrangler, e acessar o arquivo nesta mesma pasta "importandoTABS/" para editar o arquivo com o codigo abaixo:

rails g migration add_column_user_to_user user:string

rake db:migrate




1. Aceitar (via um formulário) o upload de arquivos text, com dados separados por TAB testar o aplicativo usando o arquivo fornecido. A primeira linha do arquivo tem o nome das colunas. Você pode assumir que as colunas estarão sempre nesta ordem, e que sempre haverá uma linha de cabeçalho. Um arquivo de exemplo chamado 'dados.txt' está incluído neste repositório.
2.Interpretar ("parsear") o arquivo recebido, normalizar os dados, e salvar corretamente a informação em um banco de dados relacional.
3.Exibir todos os registros importados, bem como a receita bruta total dos registros contidos no arquivo enviado após o upload + parser.
4.Ser escrita em Ruby 2.1+ Rails 4 e SQLite
5.Ser simples de configurar e rodar a partir das instruções fornecidas,
6.Funcionando em ambiente compatível com Unix (Linux ou Mac OS X) para Ruby On Rails e Windows para .Net. Ela deve utilizar apenas linguagens e bibliotecas livres ou gratuitas.
7.Ter um teste de model e controller automatizado para a funcionalidade pedida
8.Ter uma boa aparência e ser fácil de usar

1. Accept (via a form) to upload text files with data separated by TAB test the application using the supplied file. The first line of the file has the name of the columns. You can assume that the columns are always in order and there will always be a header row. A sample file called 'data.txt' is included in this repository.
2.Read ("parse") the received file, normalize the data, and properly save the information in a relational database.
3.Show all imported records in the file sent after uploading + parser.
4.Be written in Ruby 2.1+ 4 Rails and SQLite
5.Be simple to set up and run from the instructions.
6.Working in Unix compatible environment (Linux or Mac OS X) for Ruby on Rails. It should only use languages ​​and free or free libraries.
7.Have a model test and automated controller for the requested functionality
8.Have a good look and be easy to use