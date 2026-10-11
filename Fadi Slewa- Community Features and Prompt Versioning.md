## **1\. Main Features**

* **Share prompts:** Users can create prompts and edit or delete their own prompts.  
* **Ratings and reviews:** Users can rate a prompt from 1 to 5 and optionally leave a comment.  
* **Report prompts:** Users can report content that may be inappropriate.  
* **Version history:** The website saves an older copy each time a prompt is edited.  
* **Restore a version:** An older version can be restored, but it is saved as a new version so the history remains.

## **2\. API Endpoints**

Endpoints that create,edit,delete, etc… require to be an authenticated user. The backend should check ownership before allowing users to modify their content.

| Endpoint | Method | Description |
| ----- | ----- | ----- |
| /api/prompts | POST | Create a prompt. |
| /api/prompts/{prompt\_id} | PUT | Edit your own prompt. |
| /api/prompts/{prompt\_id} | DELETE | Delete your own prompt. |
| /api/prompts/{prompt\_id}/reviews | POST | Add a rating and optional comment. |
| /api/prompts/{prompt\_id}/reviews | GET | View ratings and comments. |
| /api/reviews/{review\_id} | PUT | Edit your own review. |
| /api/reviews/{review\_id} | DELETE | Delete your own review. |
| /api/prompts/{prompt\_id}/reports | POST | Report a prompt. |
| /api/prompts/{prompt\_id}/versions | GET | View all versions of a prompt. |
| /api/prompts/{prompt\_id}/versions/{version\_id} | GET | View one version. |
| /api/prompts/{prompt\_id}/versions/{version\_id}/restore | POST | Restore an older version as a new version. |

## **3\. Data Models**

Data models are the information stored by the website.

## **Prompt**

* id: unique prompt ID  
* user\_id: ID of the prompt owner  
* category\_id: prompt category  
* title: required prompt title  
* description: required short explanation  
* content: required prompt text  
* is\_public: whether other users can see it; true by default  
* current\_version: latest version number  
* created\_at and updated\_at: creation and last-edit times

## **PromptVersion**

* id: unique version ID  
* prompt\_id: prompt this version belongs to  
* version\_number: version number  
* title and content: saved prompt text  
* edited\_by: user who made the change  
* created\_at: time the version was saved

## **Review**

* id: unique review ID  
* prompt\_id: prompt being reviewed  
* user\_id: reviewer  
* rating: number from 1 to 5  
* comment: optional feedback  
* created\_at and updated\_at: timestamps

## **Report**

* id: unique report ID  
* prompt\_id: prompt being reported  
* user\_id: person who reported it  
* reason: why it was reported  
* details: optional extra information  
* status: starts as “pending”

## **4\. Version History Rules**

* Save the current prompt before editing it.  
* Increase the version number after each edit.  
* Restoring an older version creates a new version; it does not erase newer versions.  
* Example: restoring version 1 when version 3 is current creates version 4\.

## **5\. Access Rules**

* Users must be signed in to create prompts, reviews, and reports.  
* Only the prompt owner can edit or delete their prompt.  
* Users can edit or delete their own reviews.