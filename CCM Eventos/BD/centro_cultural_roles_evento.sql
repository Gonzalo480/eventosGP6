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
-- Table structure for table `roles_evento`
--

DROP TABLE IF EXISTS `roles_evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles_evento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `evento_id` int NOT NULL,
  `rol` enum('organizador','asistente') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_evento_rol` (`usuario_id`,`evento_id`,`rol`),
  KEY `evento_id` (`evento_id`),
  KEY `idx_roles_evento` (`usuario_id`,`evento_id`),
  CONSTRAINT `roles_evento_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `roles_evento_ibfk_2` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles_evento`
--

LOCK TABLES `roles_evento` WRITE;
/*!40000 ALTER TABLE `roles_evento` DISABLE KEYS */;
INSERT INTO `roles_evento` VALUES (1,1,1,'organizador','2025-01-31 03:18:55'),(2,1,2,'organizador','2025-01-31 03:18:55'),(3,1,3,'organizador','2025-01-31 03:18:55'),(4,1,4,'organizador','2025-01-31 03:18:55'),(5,1,5,'organizador','2025-01-31 03:18:55'),(6,2,1,'organizador','2025-01-31 03:18:55'),(7,3,2,'organizador','2025-01-31 03:18:55'),(8,4,3,'organizador','2025-01-31 03:18:55'),(9,5,4,'organizador','2025-01-31 03:18:55'),(10,6,5,'organizador','2025-01-31 03:18:55'),(11,3,1,'asistente','2025-01-31 03:18:55'),(12,2,2,'asistente','2025-01-31 03:18:55'),(13,5,3,'asistente','2025-01-31 03:18:55'),(14,6,4,'asistente','2025-01-31 03:18:55'),(15,4,5,'asistente','2025-01-31 03:18:55'),(18,8,11,'organizador','2025-01-31 10:28:01'),(19,8,12,'organizador','2025-01-31 10:28:01'),(20,8,13,'organizador','2025-01-31 10:28:01'),(28,7,11,'asistente','2025-01-31 13:30:00');
/*!40000 ALTER TABLE `roles_evento` ENABLE KEYS */;
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
