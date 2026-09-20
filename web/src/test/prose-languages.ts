// Synthetic language cases with known intended boundaries; these are not live
// agent captures. `gap` models spare terminal cells after the first physical row.
export const proseLanguageCases = [
  { name: 'English', left: '• The completed report includes detailed findings', right: '  and recommendations for the next release.', gap: 2, join: ' ' },
  { name: 'Japanese', left: '• 今回の検証では商品の選択と数量の保存が完了しました。', right: '  次の手順として配送方法と承認経路を確認します。', gap: 0, join: '' },
  { name: 'Korean', left: '• 이번 검증에서는 상품 선택과 수량 저장을 완료했습니다', right: '  다음 단계에서 배송 방법과 승인 경로를 확인합니다.', gap: 0, join: null },
  { name: 'Korean split word', left: '• 이번 검증에서는 상품 선택과 수량 저장을 완료했습니다', right: '  다음 단계에서 배송 방법과 승인 경로를 확인합니다.', gap: 1, join: null },
  { name: 'Korean word boundary', left: '• 이번 검증에서는 상품 선택과 수량 저장을 완료했습니다', right: '  다음 단계에서 배송 방법과 승인 경로를 확인합니다.', gap: 2, join: ' ' },
  { name: 'French decomposed accent', left: '• Nous avons terminé la comparaison des produits', right: '  après plusieurs vérifications complémentaires.', gap: 3, join: ' ' },
  { name: 'German', left: '• Der Bericht enthält die Ergebnisse der Prüfung', right: '  sowie Empfehlungen für die nächsten Schritte.', gap: 3, join: ' ' },
  { name: 'Spanish', left: '• El informe contiene los resultados de la revisión', right: '  además de recomendaciones para el siguiente paso.', gap: 3, join: ' ' },
  { name: 'Russian', left: '• Проверка завершена и результаты сохранены в отчёте', right: '  дальнейшие действия описаны в следующем разделе.', gap: 3, join: ' ' },
  { name: 'Greek', left: '• Η αναφορά περιλαμβάνει τα αποτελέσματα του ελέγχου', right: '  καθώς και προτάσεις για τα επόμενα βήματα.', gap: 3, join: ' ' },
  { name: 'Arabic fallback', left: '• يحتوي التقرير على نتائج الفحص وتفاصيل المنتجات', right: '  والخطوات التالية لإكمال عملية الشراء.', gap: 1, join: null },
  { name: 'Hindi fallback', left: '• रिपोर्ट में उत्पादों की जाँच और मात्रा का विस्तृत विवरण सुरक्षित रखा गया है', right: '  अगले चरण में वितरण विधि की जाँच करनी है।', gap: 1, join: null },
  { name: 'Thai fallback', left: '• ภาษาไทยภาษาไทยภาษาไทยภาษาไทยภาษาไทยภาษาไทยภาษาไทยภาษาไทย', right: '  ภาษาไทยภาษาไทยภาษาไทย', gap: 0, join: null },
  { name: 'English split word', left: '• The completed report describes international', right: '  ization requirements for the next release.', gap: 0, join: null },
  { name: 'Japanese and Latin boundary', left: '• 今回の検証では設定と接続を確認しました。対象は API', right: '  レスポンスの保存と表示です。', gap: 0, join: null },
  { name: 'hyphenated word', left: '• The report discusses mobile international-', right: '  ization and its effects on the display.', gap: 0, join: null },
] as const;
