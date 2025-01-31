CREATE DATABASE  IF NOT EXISTS `centro_cultural` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `centro_cultural`;
-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: centro_cultural
-- ------------------------------------------------------
-- Server version	8.0.40

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
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `es_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `chk_email` CHECK ((`email` like _utf8mb4'%@%.%'))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Admin Principal','admin@hallcross.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9V3UF9T3HJGQZsuHhJi',1,'2025-01-31 03:18:55'),(2,'Juan Pérez','juan@email.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9V3UF9T3HJGQZsuHhJi',0,'2025-01-31 03:18:55'),(3,'María López','maria@email.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9V3UF9T3HJGQZsuHhJi',0,'2025-01-31 03:18:55'),(4,'Carlos Ruiz','carlos@email.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9V3UF9T3HJGQZsuHhJi',0,'2025-01-31 03:18:55'),(5,'Ana Martínez','ana@email.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9V3UF9T3HJGQZsuHhJi',0,'2025-01-31 03:18:55'),(6,'Pedro Sánchez','pedro@email.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN9V3UF9T3HJGQZsuHhJi',0,'2025-01-31 03:18:55'),(7,'Juan Antonio','angel_x1_00@msn.com','scrypt:32768:8:1$ysOg3jzBHuGabYhE$a2160f95071481d64e8c22c7d02824f7b0bb8c65b27bdac4b2a5ae702f246c936a8d76293df14d04059d38000a1856350a1bf47c29821f2fa7fe8a87c3932f69',0,'2025-01-31 03:55:11'),(8,'Admin User','admin@email.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKrLQkh5PM.I5.',1,'2025-01-31 10:28:01'),(9,'Test User','user@email.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKrLQkh5PM.I5.',0,'2025-01-31 10:28:01');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-31 10:59:28
