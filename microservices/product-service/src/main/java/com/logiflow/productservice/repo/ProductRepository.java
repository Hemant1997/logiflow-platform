package com.logiflow.productservice.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.logiflow.productservice.entities.Product;
public interface ProductRepository extends JpaRepository<Product,Long> {
}
