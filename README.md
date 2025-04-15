# SmartEnergy  

SmartEnergy is a database-driven system designed for efficient facility and meter management. The system implements different user roles with specific permissions:  

- **Technician**: Can submit meter readings for facilities assigned to them via a form.  
- **Supervisor**: Manages multiple facilities, assigns technicians, and reviews meter readings from their assigned facilities.  
- **Manager**: Can assign supervisors and technicians to facilities, and has all the functionalities of both technicians and supervisors.  

The system ensures smooth workflow and accountability across all levels of facility management.  

---

## Database Schema  

### Tables:  
- **Meters**:  
  - `meter_id`, `serial_number`, `meter_type`, `facility_id`  
- **Assignments**:  
  - `assignment_id`, `user_id`, `facility_id`  
- **Facilities**:  
  - `facility_id`, `name`, `address`, `email`  
- **Readings**:  
  - `reading_id`, `value`, `reading_date`, `meter_id`, `user_id`  
- **Users**:  
  - `user_id`, `email`, `password`, `role`  
- **Notes**: *(To be defined)*  

---

## How to Run the Dev Server?  

### 1. Build the Docker Container  
```bash  
make build  
```  

### 2. Run the Docker Container  
```bash  
make run  
```  

---

## How to Stop the Dev Server?  
- Press `CTRL + C` to stop the server.  
- Run `make clean` to stop and remove containers from memory.  

---

## How to Create a Pull Request (PR)?  

### Steps:  
1. **Create a new branch**:  
   ```bash  
   git checkout -b [tag]/[feature]  
   ```  
   - `tag`: `frontend`/`backend`  
   - `feature`: e.g., `menu`, `dropdown`, `meter-readings`  

2. **Add changes**:  
   ```bash  
   git add .  
   ```  

3. **Commit changes**:  
   ```bash  
   git commit -m "Description of changes"  
   ```  

4. **Push the branch**:  
   ```bash  
   git push origin branch_name  
   ```  

5. **Create a PR on GitHub** from your branch and wait for approval.  

6. *(Optional)* **Switch back to `main`**:  
   ```bash  
   git checkout main  
   ```  

---  

SmartEnergy streamlines facility management with role-based access, ensuring efficient meter reading tracking and team coordination. 🚀