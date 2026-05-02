import apiService from './apiService';

const faceService = {
  /**
   * Sube una imagen (Blob o File) como rostro de un estudiante.
   * @param {string} studentId El UUID del estudiante
   * @param {Blob|File} imageFile El archivo de imagen (jpg/png)
   */
  uploadFace: async (studentId, imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile, 'rostro.jpg');

    const response = await apiService.post(`/api/face/upload/${studentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Elimina el rostro de un estudiante.
   * @param {string} studentId El UUID del estudiante
   */
  deleteFace: async (studentId) => {
    const response = await apiService.delete(`/api/face/${studentId}`);
    return response.data;
  },
};

export default faceService;
