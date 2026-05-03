import axiosAuth from './apiService';

/**
 * Servicio para gestionar la cámara y el reconocimiento facial desde el frontend.
 */
const cameraService = {
  /**
   * Envía un frame capturado al backend para su reconocimiento.
   * @param {Blob} imageBlob El frame en formato Blob (JPEG)
   * @param {string} subjectId El ID de la materia actual (opcional)
   * @returns {Promise<Object>} Resultado del reconocimiento
   */
  recognizeFrame: async (imageBlob, subjectId = null) => {
    const formData = new FormData();
    formData.append('file', imageBlob, 'frame.jpg');
    if (subjectId) {
      formData.append('subject_id', subjectId);
    }

    try {
      const response = await axiosAuth.post('/api/face/recognize-frame', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in recognizeFrame:', error);
      throw error;
    }
  },

  /**
   * Obtiene la configuración de la cámara (facingMode, etc.)
   */
  getVideoConstraints: (facingMode = 'user') => {
    return {
      width: 1280,
      height: 720,
      facingMode: facingMode,
    };
  },

  /**
   * Convierte una cadena base64 (de webcam.getScreenshot()) a un Blob.
   * @param {string} dataURL
   * @returns {Promise<Blob>}
   */
  dataURLtoBlob: async (dataURL) => {
    const res = await fetch(dataURL);
    return await res.blob();
  }
};

export default cameraService;
