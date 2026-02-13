import cv2
import os
import face_recognition
import pandas as pd
import time

path_faces = "faces"
if not os.path.exists(path_faces):
    os.makedirs(path_faces)


def cargar_dataframe():
    lista_archivos = os.listdir(path_faces)
    lista_archivos = [f for f in lista_archivos if f.endswith(('.jpg', '.png', '.jpeg'))]
    
    nombres = [f.split('.')[0] for f in lista_archivos]
    archivos = lista_archivos
    
    df = pd.DataFrame({
        'ID': range(1, len(lista_archivos) + 1),
        'Nombre': nombres,
        'Archivo': archivos
    })
    return df

def registrar_usuario(nombre):
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    faceClassif = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    
    print(f"\n--- INSTRUCCIONES ---")
    print(f"Hola {nombre}, mira a la cámara.")
    print("Presiona [ENTER] cuando el cuadro verde detecte tu cara para guardar.")
    print("Presiona [ESC] para cancelar.")
    
    while True:
        ret, frame = cap.read()
        if not ret: break
        frame = cv2.flip(frame, 1)
        aux_frame = frame.copy()
        
        faces = faceClassif.detectMultiScale(frame, 1.1, 5)
        
        k = cv2.waitKey(1)
        
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            # Si presiona ENTER y hay cara detectada
            if k == 13:
                rostro = aux_frame[y:y+h, x:x+w]
                rostro = cv2.resize(rostro, (150, 150)) # Mantenemos el estándar de guardado
                # Guardamos la imagen
                cv2.imwrite(f"{path_faces}/{nombre}.jpg", rostro)
                print(f"¡Guardado exitosamente como {nombre}.jpg!")
                cap.release()
                cv2.destroyAllWindows()
                return True

        cv2.imshow("Registro Facial", frame)
        
        if k == 27: # ESC
            print("Registro cancelado.")
            break
            
    cap.release()
    cv2.destroyAllWindows()
    return False

def eliminar_usuario(nombre):
    """Elimina el archivo de la carpeta."""
    ruta = f"{path_faces}/{nombre}.jpg"
    if os.path.exists(ruta):
        os.remove(ruta)
        print(f"Usuario {nombre} eliminado.")
    else:
        print("El usuario no existe.")

# --- FUNCIÓN DE RECONOCIMIENTO ---

def iniciar_reconocimiento():
    facesEncodings = []
    facesNames = []
    
    # Carga de rostros para comparar
    for file_name in os.listdir(path_faces):
        if not file_name.endswith(('.jpg', '.png', '.jpeg')):
            continue
            
        try:
            image = cv2.imread(path_faces + "/" + file_name)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            # Codificamos usando la imagen completa (150x150)
            f_coding = face_recognition.face_encodings(image)[0]
            facesEncodings.append(f_coding)
            facesNames.append(file_name.split(".")[0])
        except Exception as e:
            print(f"Error cargando {file_name}: {e}")
            continue
    
    if len(facesEncodings) == 0:
        print("No se pudieron cargar rostros. Registra a alguien primero.")
        return

    print("¡Sistema listo! Presiona ESC para salir.")
    
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    faceClassif = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    while True:
        ret, frame = cap.read()
        if not ret: break
        frame = cv2.flip(frame, 1)
        orig = frame.copy()
        
        # --- CAMBIO: USAMOS EL FRAME ORIGINAL (SIN REDUCIR) ---
        faces = faceClassif.detectMultiScale(frame, 1.1, 5)
        
        for (x, y, w, h) in faces:
            # Ya no multiplicamos por 4, usamos las coordenadas directas
            face_img = orig[y:y+h, x:x+w]
            face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            
            actual_encodings = face_recognition.face_encodings(face_img)
            
            name = "Desconocido"
            color = (50, 50, 255) # Rojo
            
            if len(actual_encodings) > 0:
                matches = face_recognition.compare_faces(facesEncodings, actual_encodings[0])
                if True in matches:
                    first_match_index = matches.index(True)
                    name = facesNames[first_match_index]
                    color = (125, 220, 0) # Verde

            # Dibujar en el frame original
            cv2.rectangle(frame, (x, y+h), (x+w, y+h+30), color, -1)
            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, name, (x, y+h+25), 2, 1, (255, 255, 255), 2, cv2.LINE_AA)
            
        cv2.imshow("Reconocimiento en Vivo - Calidad Alta", frame)
        if cv2.waitKey(1) == 27: break
        
    cap.release()
    cv2.destroyAllWindows()

def main():
    while True: 
        # Limpiar consola (en Windows)
        os.system('cls')
        
        df = cargar_dataframe()
        if not df.empty:
            print("--- USUARIOS REGISTRADOS ---")
            print(df[['ID', 'Nombre']].to_string(index=False))
        else:
            print("[!] No hay usuarios registrados.")
            
        print("\n--- OPCIONES ---")
        print("1. Registrar nueva persona (Capturar Foto)")
        print("2. Eliminar persona")
        print("3. Modificar foto de persona")
        print("4. [INICIAR RECONOCIMIENTO]")
        print("5. Salir")
        
        opcion = input("\nElige una opción: ")
        
        if opcion == '1':
            nombre = input("Ingresa el nombre de la nueva persona: ").strip()
            if nombre:
                registrar_usuario(nombre)
                
        elif opcion == '2':
            nombre = input("Escribe el nombre a eliminar: ").strip()
            eliminar_usuario(nombre)
            input("Presiona Enter para continuar...")
            
        elif opcion == '3':
            nombre = input("Escribe el nombre de quien quieres actualizar la foto: ").strip()
            if os.path.exists(f"{path_faces}/{nombre}.jpg"):
                print("Se tomará una nueva foto y se reemplazará la anterior.")
                registrar_usuario(nombre)
            else:
                print("Esa persona no existe.")
                time.sleep(2)
                
        elif opcion == '4':
            if df.empty:
                print("¡Error! Necesitas registrar al menos una cara primero.")
                time.sleep(2)
            else:
                iniciar_reconocimiento()
                
        elif opcion == '5':
            print("Saliendo...")
            break
        else:
            print("Opción no válida")

if __name__ == "__main__":
    main()