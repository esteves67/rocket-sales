CREATE DATABASE  IF NOT EXISTS `rocket-sales` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `rocket-sales`;
-- MySQL dump 10.13  Distrib 8.0.20, for Win64 (x86_64)
--
-- Host: localhost    Database: rocket-sales
-- ------------------------------------------------------
-- Server version	8.0.20

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dealer`
--

DROP TABLE IF EXISTS `dealer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dealer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(45) NOT NULL,
  `fabricante` varchar(45) NOT NULL,
  `plano` int NOT NULL,
  `contaFaturamento` int DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_dealer_1_idx` (`plano`),
  KEY `fk_dealer_2_idx` (`contaFaturamento`),
  CONSTRAINT `fk_dealer_faturamento` FOREIGN KEY (`contaFaturamento`) REFERENCES `faturamento` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_dealer_planos` FOREIGN KEY (`plano`) REFERENCES `planos` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dealer`
--

LOCK TABLES `dealer` WRITE;
/*!40000 ALTER TABLE `dealer` DISABLE KEYS */;
INSERT INTO `dealer` VALUES (1,'Honda Rocket Líbero Badaró','Honda',1,NULL,'2020-05-30 11:31:30','2020-05-30 11:31:30');
/*!40000 ALTER TABLE `dealer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dealerconvites`
--

DROP TABLE IF EXISTS `dealerconvites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dealerconvites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dealer` int NOT NULL,
  `convidante` int NOT NULL,
  `email` varchar(45) NOT NULL,
  `permissao` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `aceitoEm` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_dealerConvites_1_idx` (`dealer`),
  KEY `fk_dealerConvites_2_idx` (`convidante`),
  KEY `fk_dealerConvites_3_idx` (`permissao`),
  CONSTRAINT `fk_dealerConvites_1` FOREIGN KEY (`dealer`) REFERENCES `dealer` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_dealerConvites_2` FOREIGN KEY (`convidante`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_dealerConvites_3` FOREIGN KEY (`permissao`) REFERENCES `permissoes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dealerconvites`
--

LOCK TABLES `dealerconvites` WRITE;
/*!40000 ALTER TABLE `dealerconvites` DISABLE KEYS */;
/*!40000 ALTER TABLE `dealerconvites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dealerusers`
--

DROP TABLE IF EXISTS `dealerusers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dealerusers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dealer` int NOT NULL,
  `user` int NOT NULL,
  `permissao` int NOT NULL,
  `principal` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`id`),
  KEY `fk_dealerUsers_1_idx` (`dealer`),
  KEY `fk_dealerUsers_2_idx` (`user`),
  KEY `fk_dealerUsers_3_idx` (`permissao`),
  CONSTRAINT `fk_dealerUsers_dealer` FOREIGN KEY (`dealer`) REFERENCES `dealer` (`id`),
  CONSTRAINT `fk_dealerUsers_permissao` FOREIGN KEY (`permissao`) REFERENCES `permissoes` (`id`),
  CONSTRAINT `fk_dealerUsers_user` FOREIGN KEY (`user`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dealerusers`
--

LOCK TABLES `dealerusers` WRITE;
/*!40000 ALTER TABLE `dealerusers` DISABLE KEYS */;
INSERT INTO `dealerusers` VALUES (1,1,73,4,_binary '\0');
/*!40000 ALTER TABLE `dealerusers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faturamento`
--

DROP TABLE IF EXISTS `faturamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faturamento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user` int NOT NULL,
  `cnpj` varchar(18) NOT NULL,
  `inscricaoEstadual` varchar(45) NOT NULL,
  `razaoSocial` varchar(100) NOT NULL,
  `endereco` varchar(100) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `estado` varchar(2) NOT NULL,
  `cep` varchar(9) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_faturamento_1_idx` (`user`),
  CONSTRAINT `fk_faturamento_1` FOREIGN KEY (`user`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faturamento`
--

LOCK TABLES `faturamento` WRITE;
/*!40000 ALTER TABLE `faturamento` DISABLE KEYS */;
INSERT INTO `faturamento` VALUES (1,73,'00.000.000/0000-00','Isento','Honda Rocket','Rua Líbero Badaro, 5000','São Paulo','SP','01008-000','2020-05-30 11:30:46','2020-05-30 11:30:46');
/*!40000 ALTER TABLE `faturamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(200) DEFAULT NULL,
  `cpf` varchar(45) DEFAULT NULL,
  `dataNascimento` date DEFAULT NULL,
  `telefone1` varchar(45) DEFAULT NULL,
  `telefone2` bigint DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `veiculoInteresse` varchar(200) DEFAULT NULL,
  `vendedor` varchar(200) DEFAULT NULL,
  `testdrive` tinyint DEFAULT NULL,
  `testdriveMotivo` varchar(200) DEFAULT NULL,
  `testDriveHora` datetime DEFAULT NULL,
  `statusNegociacao` varchar(200) DEFAULT NULL,
  `numeroPedido` varchar(200) DEFAULT NULL,
  `motivoDesistencia` varchar(200) DEFAULT NULL,
  `horaEntrada` datetime DEFAULT NULL,
  `horaSaida` datetime DEFAULT NULL,
  `observacao` varchar(45) DEFAULT NULL,
  `comoconheceu` varchar(45) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int DEFAULT NULL,
  `dealer` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk1_idx` (`createdBy`),
  KEY `fk2_idx` (`dealer`),
  CONSTRAINT `fk1` FOREIGN KEY (`createdBy`) REFERENCES `user` (`id`),
  CONSTRAINT `fk2` FOREIGN KEY (`dealer`) REFERENCES `dealer` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES (2,'Claudio Scarpa','123.123.123-77','1989-05-13','11935113700',11935113700,'devdev@amaro.com.br','Jetta','Claudio',0,'Não tinha o carro dispnível.','2020-09-07 07:42:00',NULL,NULL,NULL,'2020-07-03 08:00:00','2020-03-07 11:00:00','','Revista','2020-07-03 14:13:18','2020-07-03 14:13:18',76,1),(3,'Claudio Scarpa',NULL,NULL,'11935113700',NULL,'devdev@amaro.com.br','Jetta','Claudio',NULL,NULL,NULL,NULL,NULL,NULL,'2020-07-03 08:00:00',NULL,'','Revista','2020-07-03 14:20:20','2020-07-03 14:20:20',76,1);
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menusmodulos`
--

DROP TABLE IF EXISTS `menusmodulos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menusmodulos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `modulo` varchar(45) DEFAULT NULL,
  `nome` varchar(45) DEFAULT NULL,
  `rota` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menusmodulos`
--

LOCK TABLES `menusmodulos` WRITE;
/*!40000 ALTER TABLE `menusmodulos` DISABLE KEYS */;
INSERT INTO `menusmodulos` VALUES (6,'showroom','Dashboard','/dashboard'),(7,'perseguidor','Dashboard','/dashboard'),(8,'prospeccao','Dashboard','/dashboard'),(9,'showroom','Showroom','/showroom'),(10,'base','Cadastrar Empresa','/cadastrarempresa');
/*!40000 ALTER TABLE `menusmodulos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menuspermissoes`
--

DROP TABLE IF EXISTS `menuspermissoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menuspermissoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `menu` int NOT NULL,
  `permissao` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_menuspermissoes_1_idx` (`permissao`),
  KEY `fk_menuspermissoes_2_idx` (`menu`),
  CONSTRAINT `fk_menuspermissoes_1` FOREIGN KEY (`permissao`) REFERENCES `permissoes` (`id`),
  CONSTRAINT `fk_menuspermissoes_2` FOREIGN KEY (`menu`) REFERENCES `menusmodulos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menuspermissoes`
--

LOCK TABLES `menuspermissoes` WRITE;
/*!40000 ALTER TABLE `menuspermissoes` DISABLE KEYS */;
INSERT INTO `menuspermissoes` VALUES (1,6,1),(2,7,1),(3,8,1),(4,9,1),(5,7,2),(6,8,2),(7,8,3),(8,9,3),(9,6,4),(10,7,4),(11,8,4),(12,9,4);
/*!40000 ALTER TABLE `menuspermissoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissoes`
--

DROP TABLE IF EXISTS `permissoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissoes`
--

LOCK TABLES `permissoes` WRITE;
/*!40000 ALTER TABLE `permissoes` DISABLE KEYS */;
INSERT INTO `permissoes` VALUES (1,'Recepcionista'),(2,'Vendedor'),(3,'Gerente'),(4,'Administrador');
/*!40000 ALTER TABLE `permissoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planos`
--

DROP TABLE IF EXISTS `planos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(45) NOT NULL,
  `showroom` varchar(45) NOT NULL DEFAULT '0',
  `perseguidor` varchar(45) NOT NULL DEFAULT '0',
  `prospeccao` varchar(45) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planos`
--

LOCK TABLES `planos` WRITE;
/*!40000 ALTER TABLE `planos` DISABLE KEYS */;
INSERT INTO `planos` VALUES (1,'Grátis','1','0','0'),(2,'Bronze','1','1','0'),(3,'Prata','1','0','1'),(4,'Ouro','1','1','1');
/*!40000 ALTER TABLE `planos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `celular` bigint DEFAULT NULL,
  `password` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resetPasswordToken` varchar(100) DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='			';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (73,'dev@rocket-sales.com.br','Dev User',NULL,'$2a$10$xksWE1Umd63T/nDG1GlyvOKh80v2YygF0cPpDEFIR6UuOVbS7QIL.','2020-05-30 11:24:33','2020-05-30 11:24:33','e25a5b9a00437e1b540f4509b0b0b702a0084db9','2020-05-30 13:27:24');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'rocket-sales'
--

--
-- Dumping routines for database 'rocket-sales'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-07-01 14:00:28
