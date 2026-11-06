package com.logiflow.warehouseservice.repo;

import com.logiflow.warehouseservice.entities.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
public interface WarehouseRepository extends JpaRepository<Warehouse,Long> {
}
