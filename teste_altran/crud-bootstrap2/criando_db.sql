/*Criando base de dados*/
CREATE DATABASE crudboot;

/*Criando tabela produtos*/
CREATE TABLE  `produtos` (
`id_produto` INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
`nome` VARCHAR( 100 ) NOT NULL ,
`descricao` TEXT( 200 ) NOT NULL ,
`preco` DECIMAL( 50 ) NOT NULL
) ENGINE = INNODB;

/*Criando tabela clientes*/
CREATE TABLE  `clientes` (
`id_clientes` INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
`nome` VARCHAR( 100 ) NOT NULL ,
`email` VARCHAR( 100 ) NOT NULL ,
`telefone` VARCHAR( 15 ) NOT NULL
) ENGINE = INNODB;

/*Criando tabela pedidos*/
CREATE TABLE  `pedidos` (
`id_pedidos` INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
`id_clientes` INT NOT NULL ,
`id_produto` INT NOT NULL
) ENGINE = INNODB;

/*Relacionando tabelas com chaves estrangeiras*/
ALTER TABLE `pedidos` ADD FOREIGN KEY (`id_clientes`) REFERENCES `clientes` (`id_clientes`);

/*Relacionando tabelas com chaves estrangeiras*/
ALTER TABLE `pedidos` ADD FOREIGN KEY (`id_produtos`) REFERENCES `produtos` (`id_produtos`);