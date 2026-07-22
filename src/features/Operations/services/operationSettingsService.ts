import axiosInstance from '../../../lib/auth';
import { OPERATIONS_ENDPOINTS } from '../../../config/constant';

export type ExcelExtractionStrategy = 'entire_sheet' | 'semantic_split';

export interface ExcelExtractionStrategyResponse {
  excel_extraction_strategy: ExcelExtractionStrategy;
  semantic_window_rows: number;
}

const operationSettingsService = {
  getExcelExtractionStrategy: async (): Promise<ExcelExtractionStrategyResponse> => {
    const response = await axiosInstance.get(OPERATIONS_ENDPOINTS.GET_EXCEL_EXTRACTION_STRATEGY);
    return response.data;
  },

  updateExcelExtractionStrategy: async (
    excelExtractionStrategy: ExcelExtractionStrategy,
  ): Promise<ExcelExtractionStrategyResponse> => {
    const response = await axiosInstance.patch(
      OPERATIONS_ENDPOINTS.UPDATE_EXCEL_EXTRACTION_STRATEGY,
      { excel_extraction_strategy: excelExtractionStrategy },
    );
    return response.data;
  },
};

export default operationSettingsService;