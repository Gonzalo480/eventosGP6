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
-- Table structure for table `eventos`
--

DROP TABLE IF EXISTS `eventos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `fecha` date NOT NULL,
  `horario` enum('mañana','tarde','noche') NOT NULL,
  `salon_id` int NOT NULL,
  `precio` decimal(10,2) DEFAULT '0.00',
  `estado` enum('pendiente','activo','finalizado','cancelado') DEFAULT 'pendiente',
  `imagen_url` varchar(255) DEFAULT NULL,
  `descripcion` text,
  `contacto_responsable` varchar(200) DEFAULT NULL,
  `max_entradas_por_persona` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `categoria_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_salon_fecha_horario` (`salon_id`,`fecha`,`horario`),
  KEY `idx_eventos_fecha` (`fecha`),
  KEY `idx_eventos_estado` (`estado`),
  KEY `categoria_id` (`categoria_id`),
  CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`salon_id`) REFERENCES `salones` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `eventos_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`),
  CONSTRAINT `chk_precio` CHECK ((`precio` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eventos`
--

LOCK TABLES `eventos` WRITE;
/*!40000 ALTER TABLE `eventos` DISABLE KEYS */;
INSERT INTO `eventos` VALUES (1,'Masterclass de Yoga','2025-02-07','mañana',1,1500.00,'activo','https://example.com/yoga.jpg','Masterclass de yoga para todos los niveles','Juan Pérez - Tel: 555-0101',2,'2025-01-31 03:18:55',NULL),(2,'Entrenamiento Funcional','2025-02-14','tarde',2,1200.00,'activo','https://example.com/fitness.jpg','Sesión intensiva de entrenamiento funcional','María López - Tel: 555-0102',1,'2025-01-31 03:18:55',NULL),(3,'Taller de Danza Contemporánea','2025-02-21','noche',1,2000.00,'activo','https://example.com/danza.jpg','Explora la danza contemporánea','Carlos Ruiz - Tel: 555-0103',2,'2025-01-31 03:18:55',NULL),(4,'Meditación Guiada','2025-02-05','mañana',3,800.00,'activo','https://example.com/meditacion.jpg','Sesión de meditación para principiantes','Ana Martínez - Tel: 555-0104',3,'2025-01-31 03:18:55',NULL),(5,'Karate para Principiantes','2025-02-10','tarde',2,1800.00,'activo','https://example.com/karate.jpg','Introducción al karate tradicional','Pedro Sánchez - Tel: 555-0105',2,'2025-01-31 03:18:55',NULL),(11,'Workshop Python','2025-02-15','tarde',1,100.00,'activo','/static/img/evento-default.jpg','Workshop intensivo de Python','contact@email.com',1,'2025-01-31 10:28:01',1),(12,'Conferencia Web','2025-02-20','mañana',2,150.00,'activo','/static/img/evento-default.jpg','Conferencia sobre desarrollo web','contact@email.com',1,'2025-01-31 10:28:01',1),(13,'Taller de React','2025-03-01','tarde',1,200.00,'activo','/static/img/evento-default.jpg','Taller práctico de React','contact@email.com',1,'2025-01-31 10:28:01',2);
/*!40000 ALTER TABLE `eventos` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `asignar_rol_organizador_after_insert` AFTER INSERT ON `eventos` FOR EACH ROW BEGIN
    INSERT INTO roles_evento (usuario_id, evento_id, rol)
    SELECT LAST_INSERT_ID(), NEW.id, 'organizador';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-31 10:59:29
