-- Disquería - Modelo relacional (MySQL 8). El catálogo vive en MongoDB.

DROP DATABASE IF EXISTS disqueria;
CREATE DATABASE disqueria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE disqueria;

CREATE TABLE usuario (
    id_usuario       INT          NOT NULL AUTO_INCREMENT,
    nombre           VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    contrasenia_hash VARCHAR(255) NOT NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_email UNIQUE (email)
);

-- amazon_id referencia al álbum en MongoDB (referencia lógica, sin FK).
CREATE TABLE producto (
    id_producto  INT            NOT NULL AUTO_INCREMENT,
    amazon_id    VARCHAR(20)    NOT NULL,
    formato      ENUM('CD','Vinilo') NOT NULL,
    precio       DECIMAL(10,2)  NOT NULL,
    stock        INT            NOT NULL DEFAULT 0,
    activo       BOOLEAN        NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_producto PRIMARY KEY (id_producto),
    CONSTRAINT uq_producto_album_formato UNIQUE (amazon_id, formato),
    CONSTRAINT ck_producto_precio CHECK (precio > 0),
    CONSTRAINT ck_producto_stock  CHECK (stock >= 0)
);
CREATE INDEX ix_producto_precio ON producto (activo, precio);

CREATE TABLE favorito (
    id_usuario     INT         NOT NULL,
    amazon_id      VARCHAR(20) NOT NULL,
    fecha_agregado DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_favorito PRIMARY KEY (id_usuario, amazon_id),
    CONSTRAINT fk_favorito_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE
);

-- Un pedido = un producto.
CREATE TABLE pedido (
    id_pedido         INT            NOT NULL AUTO_INCREMENT,
    id_usuario        INT            NOT NULL,
    id_producto       INT            NOT NULL,
    cantidad          INT            NOT NULL,
    precio_unitario   DECIMAL(10,2)  NOT NULL,
    fecha             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado            ENUM('pendiente','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
    email_contacto    VARCHAR(255)   NOT NULL,
    telefono_contacto VARCHAR(30)    NOT NULL,
    domicilio_envio   VARCHAR(255)   NOT NULL,
    CONSTRAINT pk_pedido PRIMARY KEY (id_pedido),
    CONSTRAINT fk_pedido_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuario (id_usuario),
    CONSTRAINT fk_pedido_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto),
    CONSTRAINT ck_pedido_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_pedido_precio   CHECK (precio_unitario > 0)
);
CREATE INDEX ix_pedido_usuario ON pedido (id_usuario);

-- Vista del listado de pedidos
CREATE VIEW v_pedidos AS
SELECT p.id_pedido, p.fecha, p.estado, p.cantidad, p.precio_unitario,
       p.cantidad * p.precio_unitario AS total,
       p.id_usuario, u.nombre AS usuario,
       p.domicilio_envio, p.email_contacto, p.telefono_contacto,
       pr.id_producto, pr.amazon_id, pr.formato
FROM pedido p
JOIN usuario  u  ON u.id_usuario   = p.id_usuario
JOIN producto pr ON pr.id_producto = p.id_producto;
