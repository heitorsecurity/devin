# O Ruby sabe o que você
# quer dizer, mesmo que isso
# seja fazer contas em
# um Array completo

class ListarCidades
  attr_accessor :cidades

  # Criar o objecto
  def initialize(cidades = "Sao Paulo")
    @cidades = cidades
  end
  
    # Visitar cidades
  def visitar_cidades
    if @cidades.nil?
      puts "Nennhuma cidade..."
    elsif @cidades.respond_to?("each")
      # @cidades é uma lista de algum tipo,
      # assim podemos iterar!
      @cidades.each do |cidades|
        puts "Ainda falta visitar as cidades #{cidades}"
      end
    else
      puts "Ainda falta visitar as cidades #{@cidades}"
    end
  end
  
    # Cidades ja visitadas
  def visitadas
    if @cidades.nil?
      puts "Nennhuma cidade..."
    elsif @cidades.respond_to?("join")
      # Juntar os elementos à lista
      # usando a vírgula como separador
      puts "Essas eu já fui: #{@cidades.join(", ")}"
    else
      puts "Essas eu já fui: #{@cidades}"
    end
  end
  
 end
  
  if __FILE__ == $0
  mg = ListarCidades.new
  mg.visitar_cidades
  mg.visitadas

  # Alterar o nome para um vector de cidades visitadas
  mg.cidades = "Berlim Oslo"
  mg.visitar_cidades
  mg.visitadas
  
  # Alterar o nome para um vector de cidades
  mg.cidades = ["Londres", "Oslo", "Paris", "Amsterdão", "Berlim"]
  mg.visitar_cidades
  mg.visitadas

  # Alterar para nil
  mg.cidades = nil
  mg.visitar_cidades
  mg.visitadas
end